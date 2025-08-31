import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

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

export interface ApiResponse {
  success: boolean;
  message: string;
  data: any;
}

@Injectable({
  providedIn: 'root',
})
export class PromocionesService {
  private apiUrl = 'http://34.10.172.54:8080';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  getPromociones(businessId: number): Observable<ApiResponse> {
    const params = new HttpParams().set('businessId', businessId.toString());
    const headers = this.getHeaders();

    return this.http.get<ApiResponse>(
      `${this.apiUrl}/promotions/business/private`,
      {
        params,
        headers,
      }
    );
  }

  getPromotionPublic(promotionType?: string, categoryId?: number): Observable<ApiResponse> {
    let params = new HttpParams();

    if (promotionType) {
      params = params.set('promotionType', promotionType);
    }

    if (categoryId) {
      params = params.set('categoryId', categoryId.toString());
    }

    return this.http.get<ApiResponse>(
      `${this.apiUrl}/promotions/business/public/search`,
      { params }
    );
  }

  crearPromocion(dto: any, photo: File): Observable<ApiResponse> {
    const formData = new FormData();

    const promocionDto = {
      businessId: dto.businessId,
      tipoPromocion: dto.tipoPromocion,
      tituloPromocion: dto.tituloPromocion,
      fechaPromoInicio: dto.fechaPromoInicio,
      fechaPromoFin: dto.fechaPromoFin,
      condiciones: dto.condiciones,
    };

    formData.append(
      'dto',
      new Blob([JSON.stringify(promocionDto)], {
        type: 'application/json',
      })
    );

    formData.append('photo', photo);

    const headers = this.getHeaders();

    console.log('Enviando promoción:', promocionDto);
    console.log('Archivo:', photo.name, photo.type, photo.size);

    return this.http.post<ApiResponse>(
      `${this.apiUrl}/promotions/business/create`,
      formData,
      { headers }
    );
  }

  editarPromocion(id: number, dto: any, photo?: File): Observable<ApiResponse> {
    const formData = new FormData();

    const promocionDto = {
      titlePromotion: dto.tituloPromocion,
      promoType: dto.tipoPromocion,
      conditions: dto.condiciones,
      datePromoStart: dto.fechaPromoInicio,
      datePromoEnd: dto.fechaPromoFin,
      businessId: dto.businessId,
    };

    formData.append(
      'dto',
      new Blob([JSON.stringify(promocionDto)], {
        type: 'application/json',
      })
    );

    if (photo) {
      formData.append('photo', photo);
    }

    const headers = this.getHeaders();

    return this.http.put<ApiResponse>(
      `${this.apiUrl}/promotions/business/update/${id}`,
      formData,
      { headers }
    );
  }

  eliminarPromocion(id: number): Observable<ApiResponse> {
    const headers = this.getHeaders();
    const params = new HttpParams().set('promoId', id.toString());

    return this.http.delete<ApiResponse>(
      `${this.apiUrl}/promotions/business/delete`,
      {
        headers,
        params,
      }
    );
  }
}
