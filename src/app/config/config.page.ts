/* eslint-disable arrow-body-style */
import { HttpService } from './../services/http.service';
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/member-ordering */
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  ActionSheetController,
  AlertController,
  IonDatetime,
  IonModal,
} from '@ionic/angular';
import { OverlayEventDetail } from '@ionic/core';
import { EventService } from '../services/event.service';
import { EventoSharedService } from '../services/evento-shared.service';
import { StorageService } from '../services/storage.service';

@Component({
  selector: 'app-config',
  templateUrl: './config.page.html',
  styleUrls: ['./config.page.scss'],
})
export class ConfigPage implements OnInit {
  @ViewChild(IonModal) modal: IonModal;
  @ViewChild(IonDatetime) dateTime: IonDatetime;

  message =
    'This modal example uses triggers to automatically open a modal when the button is clicked.';
  name: string;

  configForm: FormGroup;

  isSubmitted = false;
  eventos = [];

  apiUrl = '';

  result: string;

  videoDevices = [];
  constructor(
    private storage: StorageService,
    private formBuilder: FormBuilder,
    private actionSheetCtrl: ActionSheetController,
    private alertController: AlertController,
    private eventoService: EventoSharedService,
    private router: Router,
    public http: HttpService
  ) {}

  ngOnInit() {
    this.configForm = this.formBuilder.group({
      nome: ['', Validators.required],
      tempo: ['7', Validators.required],
      frameName: [''],
      audioName: [''],
      data: [''],
      videoInput: ['', Validators.required],

    });

    this.eventos = this.storage.get('eventos') || [];
    this.apiUrl = this.storage.get('apiUrl') || '';
    console.log(this.apiUrl);
    console.log(this.http.url);

    if (this.apiUrl.length) {
      EventService.get('apiUrl').emit(this.apiUrl);
    }
  }

  ionViewDidEnter() {
    setTimeout(() => {
      console.log(new Date().toISOString());
      this.errorControl.data.setValue(new Date().toISOString());
    }, 1000);

    console.log(this.getDevices());
  }
  get errorControl() {
    return this.configForm.controls;
  }

  cancel() {
    this.modal.dismiss(null, 'cancel');
  }

  confirm() {
    this.modal.dismiss(this.name, 'confirm');
  }

  onWillDismiss(event: Event) {
    const ev = event as CustomEvent<OverlayEventDetail<string>>;
    if (ev.detail.role === 'confirm') {
      this.message = `Hello, ${ev.detail.data}!`;
    }
  }

  salvaEvento(config: NgForm) {
    this.isSubmitted = true;
    console.log(config);
    this.eventos.push(config);
    this.guardaEventos();

    this.configForm.reset();
    this.modal.dismiss();
  }

  async eventoActionSheet(evento: any, index: any) {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Opções do Evento',
      subHeader: evento.nome,
      buttons: [
        {
          text: 'Carregar Evento',
          handler: () => {
            this.setConfig(evento);
          },
        },

        {
          text: 'Visualizar Evento',
          handler: () => {
            this.seeEvento(evento);
          },
        },
        {
          text: 'Deletar',
          role: 'destructive',

          handler: () => {
            this.deleteEvento(index);
          },
        },

        {
          text: 'Cancelar',
          role: 'cancel',
          data: {
            action: 'cancel',
          },
        },
      ],
    });

    await actionSheet.present();

    const result = await actionSheet.onDidDismiss();
    this.result = JSON.stringify(result, null, 2);
  }

  async deleteEvento(i) {
    const alert = await this.alertController.create({
      header: 'Deseja realmente Deletar o evento?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => {},
        },
        {
          text: 'Sim',
          role: 'confirm',
          handler: () => {
            this.eventos.splice(i, 1);
            this.guardaEventos();
          },
        },
      ],
    });

    await alert.present();

    const { role } = await alert.onDidDismiss();
  }

  async guardaEventos() {
    this.storage.set('eventos', this.eventos);
  }

  setConfig(config) {
    this.eventoService.setConfig(config);
    this.router.navigate(['/home']);
  }

  async seeEvento(evento) {
    const alert = await this.alertController.create({
      header: `Nome:${evento.nome},  Gravação: ${evento.tempo} seg`,
      subHeader: `${evento.frameName ? 'Frame: ' + evento.frameName : ''} ${
        evento.audioName ? ', Audio: ' + evento.audioName : ''
      }  ${
        evento.camera === 'user' ? ', Câmera: Frontal' : ', Câmera: Traseira'
      }`,
      buttons: [
        {
          text: 'Fechar',
          role: 'cancel',
          handler: () => {},
        },
      ],
    });

    await alert.present();
  }

  async configUrltAlert() {
    const alert = await this.alertController.create({
      header: 'Digite a url do servidor',
      subHeader: 'ex: http://localhost:3000',
      buttons: ['OK'],
      inputs: [
        {
          placeholder: 'URL',
          value: `${this.apiUrl ? this.apiUrl : ''}`,
          handler: (res) => {
            console.log(res);
          },
        },
      ],
    });

    await alert.present();

    alert.onWillDismiss().then((res) => {
      if (res.data?.values[0]) {
        this.apiUrl = res.data.values[0];
        this.storage.set('apiUrl', res.data.values[0]);
        EventService.get('apiUrl').emit(res.data.values[0]);
      }
    });
  }

  getDevices() {
    this.videoDevices = [];
    // AFAICT in Safari this only gets default devices until gUM is called :/
    return navigator.mediaDevices.enumerateDevices().then((res) => {
      res.forEach((element) => {
        console.log(element);

        if (element.kind === 'videoinput') {
          this.videoDevices.push(element)
        }
      });
      return res;
    });
  }
}
