import { TestBed } from '@angular/core/testing';

import { DetallePublicoService } from './detalle-publico.service';

describe('DetallePublicoService', () => {
  let service: DetallePublicoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DetallePublicoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
