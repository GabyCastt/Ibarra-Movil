import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DetallePublicoPage } from './detalle-publico.page';

describe('DetallePublicoPage', () => {
  let component: DetallePublicoPage;
  let fixture: ComponentFixture<DetallePublicoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DetallePublicoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
