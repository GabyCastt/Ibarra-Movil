import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EliminarNegocioPage } from './eliminar-negocio.page';

describe('EliminarNegocioPage', () => {
  let component: EliminarNegocioPage;
  let fixture: ComponentFixture<EliminarNegocioPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(EliminarNegocioPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
