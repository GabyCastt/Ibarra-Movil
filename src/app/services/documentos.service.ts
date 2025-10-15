import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DocumentosService {
  private readonly baseUrl = `${environment.apiUrl}/users`;

  private readonly endpoints = {
    cedula: 'get-identity-document',
    certificado: 'get-certificate',
    firmado: 'get-signed-document',
    comprobante: 'get-payment-receipt'
  };

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getDocumentoPdf(tipoDocumento: 'cedula' | 'certificado' | 'firmado' | 'comprobante') {
    const endpoint = this.endpoints[tipoDocumento];
    const url = `${this.baseUrl}/${endpoint}`;

    return this.http.get(url, {
      headers: this.getAuthHeaders(),
      responseType: 'blob'
    });
  }
}
