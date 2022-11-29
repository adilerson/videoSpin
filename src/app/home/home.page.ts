import { AnimationController, ToastController } from '@ionic/angular';
/* eslint-disable no-underscore-dangle */
/* eslint-disable @angular-eslint/use-lifecycle-interface */
/* eslint-disable @typescript-eslint/semi */
/* eslint-disable @typescript-eslint/no-inferrable-types */
/* eslint-disable prefer-const */
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { CapacitorVideoPlayer } from 'capacitor-video-player';
import { VideoService } from '../services/video.service';
import * as WebVPPlugin from 'capacitor-video-player';
import { HttpService } from '../services/http.service';
import { async, Subscription } from 'rxjs';
import { EventoSharedService } from '../services/evento-shared.service';
import { Router } from '@angular/router';
import { IonModal } from '@ionic/angular';
import { StorageService } from '../services/storage.service';
import { EventService } from '../services/event.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit, AfterViewInit {
  @ViewChild('video') captureElement: ElementRef;
  @ViewChild(IonModal) modal: IonModal;
  @ViewChild('delayEffect', { read: ElementRef, static: true })
  delayEffect: ElementRef;
  @ViewChild('recordEffect', { read: ElementRef, static: true })
  recordEffect: ElementRef;

  mediaRecorder: any;
  videoPlayer: any;
  isRecording = false;
  videos = [];
  counter: number = 1;
  interval: any;
  camera: string = 'user';
  efeito: number = 0;
  segundos: number = 12000;

  delay: number = 8;

  isReady = false;
  intervalDelay: any;
  showCamera: boolean = false;
  stream: MediaStream;

  evento: any;

  subscription: Subscription = new Subscription();
  eventoDetails: {
    name: string;
    audio: string;
    frame: string;
    vNormal: string;
    vFast: string;
    vSlow: string;
  };
  segundosDisplay: string;
  videoDevices: any[];
  apiUrl: any;
  delayStarted = false;
  position = 'top';
  constructor(
    public videoService: VideoService,
    private changeDetector: ChangeDetectorRef,
    private http: HttpService,
    private eventoService: EventoSharedService,
    private router: Router,
    private storage: StorageService,
    private toastController: ToastController,
    private animationCtrl: AnimationController
  ) {}

  async ngOnInit() {
    const _event = this.storage.get('selectedEvento') || null;

    this.subscription = this.eventoService.currentConfig.subscribe(
      async (config: any) => {
        //console.log(config);
        //console.log(JSON.stringify(config));
        if (JSON.stringify(config) == null) {

          //console.log('localStorage')
          //console.log(_event)
          if (_event) {
            this.apiUrl = this.storage.get('apiUrl') || '';
            this.evento = _event;
            this.position =_event.position? _event.position:'center';

            this.eventoDetails = {
              name: _event.nome.replace(/[^A-Z0-9]+/gi, '_'),
              audio: _event.audioName,
              frame: _event.frameName,
              vNormal: _event.vNormal,
              vFast: _event.vFast,
              vSlow: _event.vSlow,
            };
            this.segundos = this.evento.tempo * 1000;
            if (this.apiUrl.length) {
              EventService.get('apiUrl').emit(this.apiUrl);
            }
            //console.log(_event);
          } else {
            this.router.navigate(['config']);
          }
        } else {
          this.evento = config;
          //console.log(config);
          this.storage.set('selectedEvento', config);
          this.position =config.position? config.position:'center';
          //this.camera = this.evento.camera;
          this.segundos = this.evento.tempo * 1000;
          this.eventoDetails = {
            name: config.nome.replace(/[^A-Z0-9]+/gi, '_'),
            audio: config.audioName,
            frame: config.frameName,
            vNormal: config.vNormal,
            vFast: config.vFast,
            vSlow: config.vSlow,
          };
        }
      }
    );
  }

  async ngAfterViewInit() {
    this.videos = await this.videoService.loadVideos();

    // Initialise the video player plugin
    if (Capacitor.isNativePlatform) {
      this.videoPlayer = CapacitorVideoPlayer;
    } else {
      this.videoPlayer = WebVPPlugin.CapacitorVideoPlayer;
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.eventoDetails = null;
    this.storage.remove('selectedEvento');
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        track.stop();
      });
    }
  }

  changeSegundos(value: any) {
    //console.log(value);
  }

  public pulse() {
    const animation = this.animationCtrl
      .create()
      .addElement(this.delayEffect.nativeElement)
      .duration(1000)
      .fromTo('opacity', '1', '0')
      .iterations(Infinity)
      .keyframes([
        {
          offset: 0,
          transform: 'scale(1.5) ',
          opacity: '0',
          filter: 'blur(10px)',
        },
        {
          offset: 0.5,
          transform: 'scale(0.85) ',
          opacity: '0.75',
          filter: 'blur(5px)',
        },
        {
          offset: 1,
          transform: 'scale(0.4) ',
          opacity: '1',
          filter: 'blur(0)',
        },
      ]);

    animation.play();
  }

  public pulseRecord() {
    const animation = this.animationCtrl
      .create()
      .addElement(this.recordEffect.nativeElement)
      .duration(1000)
      .fromTo('opacity', '1', '0')
      .iterations(Infinity)
      .keyframes([
        {
          offset: 0,
          transform: 'scale(1.5) ',
          opacity: '0',
          filter: 'blur(10px)',
        },
        {
          offset: 0.5,
          transform: 'scale(0.85) ',
          opacity: '0.75',
          filter: 'blur(5px)',
        },
        {
          offset: 1,
          transform: 'scale(0.4) ',
          opacity: '1',
          filter: 'blur(0)',
        },
      ]);

    animation.play();
  }

  async startVideo() {
    //console.log(this.segundos);
    this.showCamera = true;
    this.changeDetector.detectChanges();
    // Create a stream of video capturing
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: {
        // facingMode: this.camera,
        width: { ideal: 1080 },
        height: { ideal: 720 },
        /*
        width: { ideal: 4096 },
        height: { ideal: 2160 },
        */
        //user
        //environment
        deviceId: this.evento.videoInput.deviceId
          ? this.evento.videoInput.deviceId
          : undefined,
      },

      audio: false,
    });

    // Show the stream inside our video object
    this.captureElement.nativeElement.srcObject = this.stream;

    const options = { mimeType: 'video/webm' };
    this.mediaRecorder = new MediaRecorder(this.stream, options);
    this.changeDetector.detectChanges();
  }

  async delayRecord() {
    this.pulse();
    this.delayStarted = true;
    //console.log('delay in');
    this.changeDetector.detectChanges();
    this.intervalDelay = setInterval(() => {

      this.delay--;


      if (this.delay === 0) {
        //console.log(this.delay);

        this.recordVideo();

        this.delay = 8;
      }
      if (this.delay == 2) {
        this.startGiraGira()
      }

 //console.log('delay in');
    this.changeDetector.detectChanges();
    }, 1000);


  }

  async startGiraGira(){
    this.http.startGiraGira();
  }

  async recordVideo() {

    
    clearInterval(this.intervalDelay);
    this.delayStarted = false;
    this.isRecording = true;

    let chunks = [];

    this.changeDetector.detectChanges();
    this.counter = 0;

    this.interval = setInterval(() => {
      this.counter++;
      this.changeDetector.detectChanges();
    }, 1000);

    setTimeout(() => {
      this.stopRecord();
    }, this.segundos);
    // Store the video on stop
    this.mediaRecorder.onstop = async (event) => {
      const videoBuffer = new Blob(chunks, { type: 'video/mp4' });
      const fileName = new Date().getTime() + '.mp4';
      await this.videoService.storeVideo(videoBuffer);
      const formData = new FormData();

      formData.append('evento', JSON.stringify(this.eventoDetails));

      formData.append('file', videoBuffer, fileName);

      formData.forEach((res) => {
        //console.log(res);
      });



      this.http.sendVideo(formData);
      this.mediaRecorder = null;
      this.showCamera = false;
      this.stream = null;
      this.captureElement.nativeElement.srcObject = null;
      // Reload our list
      this.videos = this.videoService.videos;
      this.changeDetector.detectChanges();

      setTimeout(() => {
        this.http.stopGiraGira();
      }, 1000);
    };

    // Store chunks of recorded video
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    // Start recording wth chunks of data
    this.mediaRecorder.start(100);
    this.isRecording = true;
  }

  stopRecord() {
    clearInterval(this.interval);
    this.stream.getTracks().forEach((track) => {
      track.stop();
    });
    this.counter = 1;
    //this.mediaRecorder.stop();
    this.mediaRecorder = null;
    this.captureElement.nativeElement.srcObject = null;
    this.isRecording = false;
    this.changeDetector.detectChanges();
  }

  async sendVideo(video) {
    const realUrl = await this.videoService.getVideoUrl(video);
    const fileName = new Date().getTime() + '.mp4';

    const videoBuffer = await this.videoService.DataURIToBlob(realUrl);

    const formData = new FormData();

    formData.append('file', videoBuffer, fileName);

    // formData.append('imagem', img64);
    // formData.append('mp3', audio64.tostring());
    // formData.append('image',imgBuffer,imgFilename)

    this.http.sendVideo(formData);
    //console.log(formData);
  }

  async blobToGif(video) {
    const realUrl = await this.videoService.getVideoUrl(video);
    const videoBuffer = await this.videoService.DataURIToBlob(realUrl);
  }
  async play(video) {
    // Get the video as base64 data
    const realUrl = await this.videoService.getVideoUrl(video);

    // Show the player fullscreen
    await this.videoPlayer.initPlayer({
      mode: 'fullscreen',
      url: realUrl,
      playerId: 'fullscreen',
      componentTag: 'app-home',
    });
  }

  cancel() {
    this.modal.dismiss(null, 'cancel');
  }

  selectVideoSource(event) {
    //console.log(event);
  }

  navBack() {
    if (this.stream) {
      this.stopRecord();
    }

    this.router.navigate(['config']);
  }
}
