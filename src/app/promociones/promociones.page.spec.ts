import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PromocionesPage } from './promociones.page';

describe('PromocionesPage', () => {
  let component: PromocionesPage;
  let fixture: ComponentFixture<PromocionesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PromocionesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
