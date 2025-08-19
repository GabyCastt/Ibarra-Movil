import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface BusinessCategory {
  id: number;
  name: string;
  description: string | null;
}

export interface Business {
  id: number;
  commercialName: string;
  description: string;
  phone: string;
  email: string;
  whatsappNumber: string;
  facebook: string;
  instagram: string;
  tiktok: string;
  website: string;
  address: string;
  parishCommunitySector: string;
  googleMapsCoordinates: string;
  logoUrl: string;
  photos: string[];
  schedules: string[];
  acceptsWhatsappOrders: boolean;
  deliveryService: string;
  salePlace: string;
  category: BusinessCategory;
}

export interface BusinessResponse {
  success: boolean;
  message: string;
  data: {
    page: number;
    content: Business[];
    size: number;
    totalElements: number;
    totalPages: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class BusinessService {
  private apiUrl = environment.apiUrl;
  private businessUrl = `${this.apiUrl}/business`;

  constructor(private http: HttpClient) {}

  getApprovedBusinesses(page: number = 0, size: number = 10): Observable<BusinessResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    const url = `${this.businessUrl}/public/approved`;
    console.log('=== CALLING APPROVED BUSINESSES ===');
    console.log('URL:', url);
    console.log('Params:', params.toString());
    console.log('Full URL:', `${url}?${params.toString()}`);

    return this.http.get<BusinessResponse>(url, { params })
      .pipe(
        map(response => {
          console.log('=== RAW API RESPONSE ===');
          console.log('Response:', response);
          console.log('Response type:', typeof response);
          console.log('Has success property:', 'success' in response);
          console.log('Has data property:', 'data' in response);
          return response;
        }),
        catchError((error) => {
          console.error('=== API ERROR IN SERVICE ===');
          console.error('Error object:', error);
          console.error('Error status:', error.status);
          console.error('Error message:', error.message);
          console.error('Error body:', error.error);
          return throwError(() => new Error(this.getErrorMessage(error)));
        })
      );
  }

  // Método corregido: usar el endpoint público y filtrar por ID
  getBusinessById(id: number): Observable<Business> {
    return this.getApprovedBusinesses(0, 100) // Obtener más registros para buscar
      .pipe(
        map(response => {
          const business = response.data.content.find(b => b.id === id);
          if (!business) {
            throw new Error('Negocio no encontrado');
          }
          return business;
        }),
        catchError((error) => {
          return throwError(() => new Error(this.getErrorMessage(error)));
        })
      );
  }

  // Método para endpoint específico público (respuesta directa)
  getBusinessByIdPublic(id: number): Observable<Business> {
    const url = `${this.businessUrl}/public/${id}`;
    console.log('=== API CALL ===');
    console.log('URL:', url);
    console.log('Business ID:', id);
    
    return this.http.get<Business>(url)
      .pipe(
        map(response => {
          console.log('=== API RESPONSE ===');
          console.log('Response:', response);
          return response;
        }),
        catchError((error) => {
          console.error('=== API ERROR ===');
          console.error('Error:', error);
          console.error('Status:', error.status);
          console.error('Message:', error.message);
          return throwError(() => new Error(this.getErrorMessage(error)));
        })
      );
  }

  // Método para formatear horarios
  formatSchedules(schedules: string[]): { day: string, hours: string }[] {
    return schedules.map(schedule => {
      const parts = schedule.split(' ');
      const day = parts[0];
      const hours = parts.length > 1 ? parts[1] : 'CLOSED';
      
      return {
        day: this.translateDay(day),
        hours: hours === 'CLOSED' ? 'Cerrado' : this.formatHours(hours)
      };
    });
  }

  private translateDay(day: string): string {
    const days: { [key: string]: string } = {
      'MONDAY': 'Lunes',
      'TUESDAY': 'Martes',
      'WEDNESDAY': 'Miércoles',
      'THURSDAY': 'Jueves',
      'FRIDAY': 'Viernes',
      'SATURDAY': 'Sábado',
      'SUNDAY': 'Domingo'
    };
    return days[day] || day;
  }

  private formatHours(hours: string): string {
    if (hours.includes('-')) {
      const [start, end] = hours.split('-');
      return `${start} - ${end}`;
    }
    return hours;
  }

  // Método para obtener coordenadas como array
  getCoordinatesArray(coordinates: string): [number, number] {
    const coords = coordinates.split(',').map(coord => parseFloat(coord.trim()));
    return [coords[0], coords[1]];
  }

  private getErrorMessage(error: any): string {
    if (error.status === 404) {
      return 'No se encontraron negocios.';
    } else if (error.status === 0) {
      return 'No hay conexión con el servidor.';
    } else if (error.status >= 500) {
      return 'Error interno del servidor.';
    }
    return 'Ocurrió un error al obtener los datos.';
  }
}