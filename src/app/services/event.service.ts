/* eslint-disable curly */
import { EventEmitter, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class EventService {
  private static emitters: {
    [evento: string]: EventEmitter<any>;
  } = {};

  static get(evento: string): EventEmitter<any> {
    if (!this.emitters[evento]) this.emitters[evento] = new EventEmitter<any>();
    return this.emitters[evento];
  }
}
