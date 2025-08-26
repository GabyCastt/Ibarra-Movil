// promociones.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service'; // Ajusta la ruta según tu estructura

export interface Promocion {
  idBusinessPromo?: number;
  businessId: number;
  businessName?: string;
  tipoPromocion: string;
  tituloPromocion: string;
  fechaPromoInicio: string;
  fechaPromoFin: string;
  businessImageUrl?: string;
  condiciones: string;
}

@Injectable({
  providedIn: 'root'
})
export class PromocionesService {
  private apiUrl = 'http://34.10.172.54:8080'; // Cambia por tu URL base

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getPromociones(businessId: number): Observable<any> {
    const params = new HttpParams().set('businessId', businessId.toString());
    const headers = this.getHeaders();
    
    return this.http.get(`${this.apiUrl}/promotions/business/private`, { 
      params, 
      headers 
    });
  }

  crearPromocion(dto: any, photo: File): Observable<any> {
    const formData = new FormData();
    formData.append('dto', new Blob([JSON.stringify(dto)], { type: 'application/json' }));
    formData.append('photo', photo);
    
    const headers = this.getHeaders();
    
    return this.http.post(`${this.apiUrl}/promotions/business/create`, formData, { headers });
  }
}