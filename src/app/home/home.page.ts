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
import { Subscription } from 'rxjs';
import { EventoSharedService } from '../services/evento-shared.service';
import { Router } from '@angular/router';
import { IonModal } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit, AfterViewInit {
  @ViewChild('video') captureElement: ElementRef;
  @ViewChild(IonModal) modal: IonModal;

  mediaRecorder: any;
  videoPlayer: any;
  isRecording = false;
  videos = [];
  counter: number = 0;
  interval: any;
  camera: string = 'user';
  efeito: number = 0;
  segundos: number = 7000;

  delay: number = 6;

  isReady = false;
  intervalDelay: any;
  showCamera: boolean = false;
  stream: MediaStream;

  evento: any;

  subscription: Subscription = new Subscription();
  eventoDetails: { name: string; audio: string; frame: string };
  segundosDisplay: string;
  videoDevices: any[];

  constructor(
    public videoService: VideoService,
    private changeDetector: ChangeDetectorRef,
    private http: HttpService,
    private eventoService: EventoSharedService,
    private router: Router
  ) {}

  async ngOnInit() {
    this.subscription = this.eventoService.currentConfig.subscribe(
      (config: any) => {
        console.log(config);
        console.log(JSON.stringify(config));
        if (JSON.stringify(config) === undefined) {
          this.router.navigate(['config']);
        } else {
          this.evento = config;

          //this.camera = this.evento.camera;
          this.segundos = this.evento.tempo * 1000;
          this.eventoDetails = {
            name: config.nome,
            audio: config.audioName,
            frame: config.frameName,
          };

          this.getDevices();
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

    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        track.stop();
      });
    }
  }

  changeSegundos(value: any) {
    console.log(value);
  }

  async startVideo() {
    console.log(this.segundos);
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
    console.log('delay in');
    this.changeDetector.detectChanges();
    this.intervalDelay = setInterval(() => {
      this.changeDetector.detectChanges();
      this.delay--;
      if (this.delay === 0) {
        console.log(this.delay);
        clearInterval(this.intervalDelay);
        this.recordVideo();

        this.delay = 6;
      }
    }, 1000);
  }

  async recordVideo() {
    this.isRecording = true;

    let chunks = [];

    this.changeDetector.detectChanges();

    this.interval = setInterval(() => {
      this.counter++;
      this.changeDetector.detectChanges();
    }, 1000);

    setTimeout(() => {
      this.stopRecord();
    }, this.segundos);
    // Store the video on stop
    this.mediaRecorder.onstop = async (event) => {
      const videoBuffer = new Blob(chunks, { type: 'video/webm' });
      const fileName = new Date().getTime() + '.mp4';
      await this.videoService.storeVideo(videoBuffer);
      const formData = new FormData();

      formData.append('evento', JSON.stringify(this.eventoDetails));

      formData.append('file', videoBuffer, fileName);

      formData.forEach((res) => {
        console.log(res);
      });

      this.http.sendVideo(formData);
      this.mediaRecorder = null;
      this.showCamera = false;
      this.stream = null;
      this.captureElement.nativeElement.srcObject = null;
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
    this.stream.getTracks().forEach((track) => {
      track.stop();
    });
    this.counter = 0;
    //this.mediaRecorder.stop();
    this.mediaRecorder = null;
    this.captureElement.nativeElement.srcObject = null;
    this.isRecording = false;
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
    console.log(formData);
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

  getDevices() {
    this.videoDevices = [];


    navigator.mediaDevices.enumerateDevices().then((res) => {
      res.forEach((element) => {
        console.log(element);

        if (element.kind === 'videoinput') {
          this.videoDevices.push(element);
        }
      });
    });

    // AFAICT in Safari this only gets default devices until gUM is called :/
  }

  selectVideoSource(event) {
    console.log(event);
  }
}
