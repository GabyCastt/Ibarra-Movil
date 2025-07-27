import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule} from '@ionic/angular';
import { DocumentosService } from '../services/documentos.service';

@Component({
  selector: 'app-mis-documentos',
  templateUrl: './mis-documentos.page.html',
  styleUrls: ['./mis-documentos.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
})
export class MisDocumentosPage implements OnInit {
  loading = false;

  constructor(private documentosService: DocumentosService) {}

  ngOnInit() {}

  verIdentidad() {
    this.loading = true;
    this.documentosService.getDocumentoPdf('cedula').subscribe({
      next: (blob) => {
        const fileURL = URL.createObjectURL(blob);
        window.open(fileURL);
      },
      error: (err) => {
        console.error('Error al obtener el documento', err);
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  verCertificado() {
    this.loading = true;
    this.documentosService.getDocumentoPdf('certificado').subscribe({
      next: (blob) => {
        const fileURL = URL.createObjectURL(blob);
        window.open(fileURL);
      },
      error: (err) => {
        console.error('Error al obtener el certificado', err);
      },
      complete: () => {
        this.loading = false;
      },
    });
  }
}
