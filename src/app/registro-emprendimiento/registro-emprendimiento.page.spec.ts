import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegistroEmprendimientoPage } from './registro-emprendimiento.page';

describe('RegistroEmprendimientoPage', () => {
  let component: RegistroEmprendimientoPage;
  let fixture: ComponentFixture<RegistroEmprendimientoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RegistroEmprendimientoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
