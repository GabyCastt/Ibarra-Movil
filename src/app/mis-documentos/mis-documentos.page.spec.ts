import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MisDocumentosPage } from './mis-documentos.page';

describe('MisDocumentosPage', () => {
  let component: MisDocumentosPage;
  let fixture: ComponentFixture<MisDocumentosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MisDocumentosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
