import { TestBed } from '@angular/core/testing';

import { RegistrooService } from './registroo.service';

describe('RegistrooService', () => {
  let service: RegistrooService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RegistrooService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
