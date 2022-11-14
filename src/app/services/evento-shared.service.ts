/* eslint-disable @typescript-eslint/member-ordering */
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EventoSharedService {
  constructor() {}

  private configSource = new BehaviorSubject(Object);

  currentConfig = this.configSource.asObservable();

  setConfig(config: any) {
    this.configSource.next(config);
  }
}
