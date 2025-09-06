import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { NegociosService } from './negocios.service';

describe('NegociosService', () => {
  let service: NegociosService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(NegociosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

