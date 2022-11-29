import { async } from 'rxjs';
/* eslint-disable object-shorthand */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/dot-notation */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LoadingController, ToastController } from '@ionic/angular';
import { serverIP } from 'src/environments/environment';
import { EventService } from './event.service';

@Injectable({
  providedIn: 'root',
})
export class HttpService {
  public url = serverIP;

  public rodaApi = 'https://192.168.31.199:443';

  constructor(
    private http: HttpClient,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
    EventService.get('apiUrl').subscribe((data) => {
      console.log('get url' + data);
      this.url = data;
    });
  }

  async showLoading() {
    const loading = await this.loadingController.create({
      message: 'Aguarde, processando...',
    });

    loading.present();
  }

  async startGiraGira() {
    await this.http
      .get(`${this.rodaApi}/serial.php?status=1`)
      .subscribe(async (res) => {
        console.log(res);
        const toast = await this.toastController.create({
          message: 'success',
          duration: 1500,
          position: 'bottom',
          color: 'success',
        });

        await toast.present();
      });
  }

  async stopGiraGira() {
    await this.http
      .get(`${this.rodaApi}/serial.php?status=0`)
      .subscribe(async (res) => {
        console.log(res);
        const toast = await this.toastController.create({
          message: 'success',
          duration: 1500,
          position: 'bottom',
          color: 'success',
        });

        await toast.present();
      });
  }


  async sendVideo(formData: FormData) {
    this.showLoading();

    await this.http
      .post(`${this.url}/media`, formData, {
        responseType: 'arraybuffer',
      })
      .subscribe(
        async (res) => {
          setTimeout(() => {
            this.loadingController.dismiss();
          }, 300);

          // this.downLoadFile(res, 'video/mp4');
          console.log(res);
          if (res) {
            const toast = await this.toastController.create({
              message: 'success',
              duration: 1500,
              position: 'bottom',
              color: 'success',
            });

            await toast.present();
          } else {
            const toast = await this.toastController.create({
              message: 'Error:',
              duration: 1500,
              position: 'bottom',
              color: 'danger',
            });

            await toast.present();
          }
        },
        async (err) => {
          setTimeout(() => {
            this.loadingController.dismiss();
          }, 300);
          const toast = await this.toastController.create({
            message: 'Error:' + err.message,
            duration: 3000,
            position: 'bottom',
            color: 'danger',
          });

          await toast.present();
        }
      );
  }

  downLoadFile(data: any, type: string) {
    let blob = new Blob([data], { type: type });
    let url = window.URL.createObjectURL(blob);
    /*let pwa = window.open(url);
    if (!pwa || pwa.closed || typeof pwa.closed == 'undefined') {
        alert( 'Please disable your Pop-up blocker and try again.');
    }
    */
    const toast = this.toastController.create({
      message: 'Video criado com sucesso!',
      duration: 1500,
      position: 'middle',
    });
  }
}
