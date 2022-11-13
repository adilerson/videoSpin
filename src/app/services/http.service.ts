/* eslint-disable object-shorthand */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/dot-notation */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LoadingController, ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class HttpService {
  constructor(
    private http: HttpClient,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  async sendVideo(formData: FormData) {
    /*
    const loading = await this.loadingController.create({
      message: 'Aguarde, processando...',
    });
    */

    //await loading.present();

    this.http
      .post('https://192.168.31.199:3000/media', formData,{ responseType: 'arraybuffer'})

      .subscribe(async (res) => {
        //loading.dismiss();
        this.downLoadFile(res, 'video/mp4');
        console.log(res);
        if (res['success']) {
          const toast = await this.toastController.create({
            message: 'success',
            duration: 1500,
            position: 'bottom',
          });

          await toast.present();
        } else {
          const toast = await this.toastController.create({
            message: 'Error',
            duration: 1500,
            position: 'bottom',
          });

          await toast.present();
        }
      });
  }

  downLoadFile(data: any, type: string) {
    let blob = new Blob([data], { type: type});
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
