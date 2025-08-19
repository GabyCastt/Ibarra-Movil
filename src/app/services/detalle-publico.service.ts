import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  private apiUrl = 'your-api-base-url'; // Reemplaza con tu URL base

  constructor(private http: HttpClient) {}

  getApprovedBusinesses(): Observable<BusinessResponse> {
    return this.http.get<BusinessResponse>(`${this.apiUrl}/business/public/approved`);
  }

  getBusinessById(id: number): Observable<Business> {
    return this.http.get<Business>(`${this.apiUrl}/business/${id}`);
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
}