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

verComprobante() {
  this.loading = true;
  this.documentosService.getDocumentoPdf('comprobante').subscribe({
    next: async (response: Blob) => {
      try {
        const text = await response.text();
        const data = JSON.parse(text);

        const url = data.paymentReceiptUrl;
        if (url) {
          window.open(url, '_blank');
        } else {
        }
      } catch (error) {
        console.error('Error al procesar el comprobante', error);
      }
    },
    error: (err) => {
      console.error('Error al obtener el comprobante de pago', err);
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

  verFirmado() {
    this.loading = true;
    this.documentosService.getDocumentoPdf('firmado').subscribe({
      next: (blob) => {
        const fileURL = URL.createObjectURL(blob);
        window.open(fileURL);
      },
      error: (err) => {
        console.error('Error al obtener el documento firmado', err);
      },
      complete: () => {
        this.loading = false;
      },
    });
  }
}
