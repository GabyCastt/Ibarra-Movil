import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditarNegocioPage } from './editar-negocio.page';

describe('EditarNegocioPage', () => {
  let component: EditarNegocioPage;
  let fixture: ComponentFixture<EditarNegocioPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(EditarNegocioPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
