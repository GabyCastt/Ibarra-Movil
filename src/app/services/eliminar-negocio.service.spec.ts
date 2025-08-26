import { TestBed } from '@angular/core/testing';

import { EliminarNegocioService } from './eliminar-negocio.service';

describe('EliminarNegocioService', () => {
  let service: EliminarNegocioService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EliminarNegocioService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
