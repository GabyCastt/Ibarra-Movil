import { TestBed } from '@angular/core/testing';

import { DetallePrivadoService } from './detalle-privado.service';

describe('DetallePrivadoService', () => {
  let service: DetallePrivadoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DetallePrivadoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
