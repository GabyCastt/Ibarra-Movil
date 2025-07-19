import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegistroAppPage } from './registro-app.page';

describe('RegistroAppPage', () => {
  let component: RegistroAppPage;
  let fixture: ComponentFixture<RegistroAppPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RegistroAppPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
