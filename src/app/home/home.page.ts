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
import { UrlSerializer } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit, AfterViewInit {
  @ViewChild('video') captureElement: ElementRef;
  mediaRecorder: any;
  videoPlayer: any;
  isRecording = false;
  videos = [];
  counter: number = 0;
  interval: any;
  camera:string='user';
  efeito:number=0;
  segundos:number=7000;

delay:number=6

  isReady = false;
  intervalDelay: any;

  constructor(
    public videoService: VideoService,
    private changeDetector: ChangeDetectorRef,
    private http: HttpService,

  ) {}

  async ngOnInit() {}

  async ngAfterViewInit() {
    this.videos = await this.videoService.loadVideos();

    // Initialise the video player plugin
    if (Capacitor.isNativePlatform) {
      this.videoPlayer = CapacitorVideoPlayer;
    } else {
      this.videoPlayer = WebVPPlugin.CapacitorVideoPlayer;
    }
  }

  async delayRecord(){
    this.intervalDelay = setInterval(() => {
      this.delay--
      if ( this.delay == 0) {
        console.log(this.delay)
        clearInterval(this.intervalDelay);
        this.recordVideo();

        this.delay = 6;



      }
    }, 1000);


  }

  async recordVideo() {


    this.isRecording = true;

    /*
    function escreve(){
      console.log('teste');
    }
    for (var i = 0; i < 100; i++) {
      setInterval(escreve, 1000);
    }
    */




    // Create a stream of video capturing
    const stream = await navigator.mediaDevices.getUserMedia({


      video: {
        facingMode: this.camera,
        width: { ideal: 1080 },
        height: { ideal: 720 },
        /*
        width: { ideal: 4096 },
        height: { ideal: 2160 },
        */
        //user
        //environment
      },

      audio: false,
    });

    // Show the stream inside our video object
    this.captureElement.nativeElement.srcObject = stream;

    const options = { mimeType: 'video/webm' };
    this.mediaRecorder = new MediaRecorder(stream, options);
    let chunks = [];

    this.interval = setInterval(() => {
      this.counter++;
    }, 1000);

    setTimeout(() => {
      this.stopRecord()
    }, this.segundos);
    // Store the video on stop
    this.mediaRecorder.onstop = async (event) => {
      const videoBuffer = new Blob(chunks, { type: 'video/webm' });
      const fileName = new Date().getTime() + '.mp4';
      await this.videoService.storeVideo(videoBuffer);
      const formData = new FormData();
      formData.append('file', videoBuffer, fileName);

      this.http.sendVideo(formData);

      // Reload our list
      this.videos = this.videoService.videos;
      this.changeDetector.detectChanges();
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
    this.counter = 0;
    this.mediaRecorder.stop();
    this.mediaRecorder = null;
    this.captureElement.nativeElement.srcObject = null;
    this.isRecording = false;
  }

  async sendVideo(video) {
    const realUrl = await this.videoService.getVideoUrl(video);
    const fileName = new Date().getTime() + '.mp4';
    const imgFilename = new Date().getTime() + '.png';

    const videoBuffer = await this.videoService.DataURIToBlob(realUrl);
    const imgBuffer = await fetch('assets/back.png').then((response) =>
      response.blob()
    );

    const audioBuffer = await fetch('assets/audio.mp3').then((response) =>
    response.blob()
  );

    const img64: any = await this.videoService.blobToBase64(imgBuffer);
    const audio64: any = await this.videoService.blobToBase64(audioBuffer);


    const formData = new FormData();

    formData.append('file', videoBuffer, fileName);

   // formData.append('imagem', img64);
   // formData.append('mp3', audio64.tostring());
    // formData.append('image',imgBuffer,imgFilename)

    this.http.sendVideo(formData);
    console.log(formData);
  }

  async blobToGif(video) {
    const realUrl = await this.videoService.getVideoUrl(video);
    const videoBuffer = await this.videoService.DataURIToBlob(realUrl);
    this.videoService.blobToGif(videoBuffer);
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
}
