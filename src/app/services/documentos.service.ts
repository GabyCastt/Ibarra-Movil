import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class DocumentosService {
  private userIdentityUrl = 'http://34.10.172.54:8080/users/get-identity-document';
  private userCertificateUrl = 'http://34.10.172.54:8080/users/get-certificate';

  constructor(private http: HttpClient, private service: AuthService) { }
    getDocumentoPdf(tipoDocumento: string = 'cedula') {
    const token = this.service.getToken();
    const url = tipoDocumento === 'cedula' ? this.userIdentityUrl : this.userCertificateUrl;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get(url, {
      headers,
      responseType: 'blob' 
    });
  }
}
