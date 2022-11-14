/* eslint-disable max-len */
/* eslint-disable object-shorthand */
/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable new-parens */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-inferrable-types */
import { Injectable, OnInit } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { LoadingController } from '@ionic/angular';
//import { createFFmpeg, fetchFile, FFmpeg } from '@ffmpeg/ffmpeg';

@Injectable({
  providedIn: 'root',
})
export class VideoService {
  public videos = [];
  private VIDEOS_KEY: string = 'videos';

  isReady = false;
  gifUrlData: string;
  constructor(private loadingCtrl: LoadingController) {

  }



  async loadVideos() {
    const videoList = await Preferences.get({ key: this.VIDEOS_KEY });
    this.videos = JSON.parse(videoList.value) || [];
    return this.videos;
  }

  async storeVideo(blob) {
    const fileName = new Date().getTime() + '.mp4';

    const base64Data = (await this.convertBlobToBase64(blob)) as string;
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data,
    });

    // Add file to local array
    this.videos.unshift(savedFile.uri);

    // Write information to storage
    return Preferences.set({
      key: this.VIDEOS_KEY,
      value: JSON.stringify(this.videos),
    });
  }

  async blobToGif(blob) {
    /*   const fileName = new Date().getTime() + '.mp4';

    const myFile = new File([blob], fileName, {
      type: blob.type,
    });

    this.ffmpeg.FS('writeFile', 'video.mp4', await fetchFile(myFile));
    await this.ffmpeg.run(
      '-i',
      'video.mp4',
      '-filter_complex',
      '[v:0]trim=start=0:duration=5,setpts=PTS-STARTPTS[v0];\
      [v:0]trim=start=5:duration=5,setpts=PTS-STARTPTS[v1];\
      [v:0]trim=start=10:duration=5,setpts=PTS-STARTPTS[v2];\
      [v1]setpts=0.5*PTS[v2f]; \
      [v2]setpts=2*PTS[v3s]; \
      [v0][v2f][v3s]concat=n=3[out];\
      [out]reverse[rv];\
      [v:0]trim=start=0:duration=5,setpts=PTS-STARTPTS[v0];\
      [v:0]trim=start=5:duration=5,setpts=PTS-STARTPTS[v1];\
      [v:0]trim=start=10:duration=5,setpts=PTS-STARTPTS[v2];\
      [v1]setpts=0.5*PTS[v2f]; \
      [v2]setpts=2*PTS[v3s]; \
      [v0][v2f][v3s]concat=n=3[out1];\
      [out1][rv]concat=n=2[final]',
    [v2]reverse[v]' '[sv2]setpts=0.5*PTS[sv2f]',

           '[0:v]reverse[v]',
      '',
      '-map',
      '[final]',
      'output.mp4'
    );*/


/*
    const gifData = this.ffmpeg.FS('readFile', 'output.mp4');
    // Criando uma URL com dados do gif
    this.gifUrlData = URL.createObjectURL(
      new Blob([gifData.buffer], { type: 'video/mp4' })
    );
    const pwa = window.open(this.gifUrlData);

    if (!pwa || pwa.closed || typeof pwa.closed == 'undefined') {
      alert('Please disable your Pop-up blocker and try again.');
    } */
  }


  blobToBase64(blob) {
    return new Promise((resolve, _) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  }


  // Helper function
  public convertBlobToBase64 = (blob: Blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.readAsDataURL(blob);
    });

  // Load video as base64 from url
  async getVideoUrl(fullPath) {
    const path = fullPath.substr(fullPath.lastIndexOf('/') + 1);
    const file = await Filesystem.readFile({
      path: path,
      directory: Directory.Data,
    });
    return `data:image/png;base64,${file.data}`;
  }

  DataURIToBlob(dataURI: string) {
    const splitDataURI = dataURI.split(',');
    const byteString =
      splitDataURI[0].indexOf('base64') >= 0
        ? atob(splitDataURI[1])
        : decodeURI(splitDataURI[1]);
    const mimeString = splitDataURI[0].split(':')[1].split(';')[0];

    const ia = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ia], { type: mimeString });
  }
}
