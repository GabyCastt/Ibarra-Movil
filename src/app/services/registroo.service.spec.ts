import { TestBed } from '@angular/core/testing';

import { RegistroAppService } from './registroo.service';

describe('RegistroService', () => {
  let service: RegistroAppService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RegistroAppService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
