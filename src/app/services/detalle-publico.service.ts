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
export interface BussinessPhoto{
  id: number;
  url: string;
  fileType: string;
  publicId: string | null;
  photoType: string;
}

export interface Business {
  id: number;
  commercialName: string;
  representativeName?: string | null;
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
  logoUrl: string | null;
  photos: BussinessPhoto[];
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
export class DetallePublicoService {
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

    return this.http.get<any>(url, { params })
      .pipe(
        map(response => {
          console.log('=== RAW API RESPONSE ===');
          console.log('Response:', response);
          
          // Procesar cada negocio para extraer logos
          const processedContent = (response.data?.content || response.content || []).map((business: any) => ({
            ...business,
            logoUrl: this.extractLogoUrl(business.photos || []),
            // Asegurar valores por defecto
            email: business.email || '',
            whatsappNumber: business.whatsappNumber || '',
            photos: business.photos || []
          }));
          
          return {
            ...response,
            data: {
              ...(response.data || response),
              content: processedContent
            }
          };
        }),
        catchError((error) => {
          console.error('=== API ERROR IN SERVICE ===');
          console.error('Error object:', error);
          return throwError(() => new Error(this.getErrorMessage(error)));
        })
      );
  }

  // Método para endpoint específico público
  getBusinessByIdPublic(id: number): Observable<Business> {
    const url = `${this.businessUrl}/public-details`;
    const params = new HttpParams().set('id', id.toString());
    
    console.log('=== API CALL ===');
    console.log('URL:', url);
    console.log('Business ID:', id);

    return this.http.get<any>(url, { params })
      .pipe(
        map(response => {
          console.log('=== RAW API RESPONSE ===');
          console.log('Response:', response);
          
          // Procesar la respuesta para extraer el logo y formatear las fotos
          const processedBusiness = this.processBusinessResponse(response);
          console.log('Processed business:', processedBusiness);
          
          return processedBusiness;
        }),
        catchError((error) => {
          console.error('=== API ERROR ===');
          console.error('Error:', error);
          return throwError(() => new Error(this.getErrorMessage(error)));
        })
      );
  }

  // Método para procesar la respuesta de la API
  private processBusinessResponse(response: any): Business {
    // Extraer el logo URL de las fotos
    const logoUrl = this.extractLogoUrl(response.photos || []);
    
    return {
      ...response,
      logoUrl: logoUrl,
      // Asegurar que las propiedades opcionales tengan valores por defecto
      email: response.email || '',
      whatsappNumber: response.whatsappNumber || '',
      facebook: response.facebook || '',
      instagram: response.instagram || '',
      tiktok: response.tiktok || '',
      website: response.website || '',
      address: response.address || '',
      parishCommunitySector: response.parishCommunitySector || '',
      // Mantener el array de fotos como objetos
      photos: response.photos || [],
      // Valores por defecto para otras propiedades
      representativeName: response.representativeName || null,
      description: response.description || '',
      phone: response.phone || '',
      googleMapsCoordinates: response.googleMapsCoordinates || '',
      acceptsWhatsappOrders: response.acceptsWhatsappOrders || false,
      deliveryService: response.deliveryService || 'NO',
      salePlace: response.salePlace || 'NO',
      category: response.category || { id: 0, name: '', description: null }
    };
  }

  // Método para extraer el logo URL del array de fotos
  private extractLogoUrl(photos: BussinessPhoto[]): string {
    if (!photos || photos.length === 0) {
      return 'assets/icon/ibarra.jpg';
    }
    
    // Buscar la foto con photoType = 'LOGO'
    const logo = photos.find(photo => photo.photoType === 'LOGO');
    if (logo) {
      return logo.url;
    }
    
    // Si no hay logo, usar la primera imagen disponible
    return photos[0].url || 'assets/icon/ibarra.jpg';
  }

  // Método para obtener solo las URLs de las fotos (para el carrusel)
  getPhotoUrls(photos: BussinessPhoto[]): string[] {
    if (!photos || photos.length === 0) {
      return [];
    }
    return photos.map(photo => photo.url);
  }

  // Método para formatear horarios
  formatSchedules(schedules: string[]): { day: string, hours: string }[] {
    if (!schedules || schedules.length === 0) {
      return [];
    }
    
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
    if (!coordinates) {
      return [0, 0];
    }
    
    const coords = coordinates.split(',').map(coord => parseFloat(coord.trim()));
    return coords.length === 2 ? [coords[0], coords[1]] : [0, 0];
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