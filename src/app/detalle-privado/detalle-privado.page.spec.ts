import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DetallePrivadoPage } from './detalle-privado.page';

describe('DetallePrivadoPage', () => {
  let component: DetallePrivadoPage;
  let fixture: ComponentFixture<DetallePrivadoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DetallePrivadoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
