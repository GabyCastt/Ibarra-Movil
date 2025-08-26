import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PromocionesPublicasPage } from './promociones-publicas.page';

describe('PromocionesPublicasPage', () => {
  let component: PromocionesPublicasPage;
  let fixture: ComponentFixture<PromocionesPublicasPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PromocionesPublicasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
