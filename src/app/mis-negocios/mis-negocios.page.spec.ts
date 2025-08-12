import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MisNegociosPage } from './mis-negocios.page';

describe('MisNegociosPage', () => {
  let component: MisNegociosPage;
  let fixture: ComponentFixture<MisNegociosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MisNegociosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
