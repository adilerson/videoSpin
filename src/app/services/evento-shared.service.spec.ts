import { TestBed } from '@angular/core/testing';

import { EventoSharedService } from './evento-shared.service';

describe('EventoSharedService', () => {
  let service: EventoSharedService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EventoSharedService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
