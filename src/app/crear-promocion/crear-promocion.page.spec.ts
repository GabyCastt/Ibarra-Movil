import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CrearPromocionPage } from './crear-promocion.page';

describe('CrearPromocionPage', () => {
  let component: CrearPromocionPage;
  let fixture: ComponentFixture<CrearPromocionPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CrearPromocionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
