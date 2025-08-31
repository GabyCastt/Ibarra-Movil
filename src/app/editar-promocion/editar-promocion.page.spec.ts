import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditarPromocionPage } from './editar-promocion.page';

describe('EditarPromocionPage', () => {
  let component: EditarPromocionPage;
  let fixture: ComponentFixture<EditarPromocionPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(EditarPromocionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
