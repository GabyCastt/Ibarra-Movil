import { TestBed } from '@angular/core/testing';

import { EditarNegocioService } from './editar-negocio.service';

describe('EditarNegocioService', () => {
  let service: EditarNegocioService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EditarNegocioService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
