import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Business {
  id: number;
  commercialName: string;
  representativeName?: string;
  description: string;
  category?: {
    id: string;
    name: string;
  };
  logoUrl?: string;
  address: string;
  parishCommunitySector?: string;
  phone?: string;
  email?: string;
  whatsappNumber?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  website?: string;
  deliveryService?: string;
  salePlace?: string;
  acceptsWhatsappOrders?: boolean;
  validationStatus: string;
  registrationDate: string;
  googleMapsCoordinates?: string;
  schedules?: any[];
  photos?: any[];
  user?: {
    id: number;
    name: string;
  };
}

export interface ApiResponse {
  success: boolean;
  message: string;
  data: {
    content: Business[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  };
}

export interface UpdateBusinessRequest {
  commercialName?: string;
  description?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  website?: string;
  email?: string;
  acceptsWhatsappOrders?: boolean;
  whatsappNumber?: string;
  address?: string;
  googleMapsCoordinates?: string;
  schedules?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DetallePrivadoService {
  private apiUrl = environment.apiUrl;
  private businessUrl = `${this.apiUrl}/business`;
  
  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwt_token');
    console.log('Auth token exists:', !!token);
    
    if (!token) {
      throw new Error('No authentication token available');
    }
    
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getPrivateBusinesses(category: string = '', page: number = 0, size: number = 10): Observable<ApiResponse> {
    console.log('Getting private businesses:', { category, page, size });
    
    const params: any = {
      page: page.toString(),
      size: size.toString()
    };

    if (category && category.trim() !== '') {
      params.category = category;
    }

    return this.http.get<ApiResponse>(`${this.apiUrl}/business/private-list-by-category`, {
      headers: this.getAuthHeaders(),
      params
    }).pipe(
      tap(response => console.log('Private businesses response:', response)),
      catchError(this.handleError)
    );
  }

  getBusinessDetails(businessId: number): Observable<Business> {
    console.log('Getting business details for ID:', businessId);
    
    if (!businessId || businessId <= 0) {
      return throwError(() => new Error('Invalid business ID'));
    }

    return this.getPrivateBusinesses('', 0, 100).pipe(
      map(response => {
        console.log('Private businesses list response:', response);
        
        if (response.success && response.data && response.data.content && Array.isArray(response.data.content)) {
          const business = response.data.content.find(b => b.id === businessId);
          
          if (!business) {
            console.error('Business not found in private list. Available IDs:', response.data.content.map(b => b.id));
            throw new Error('Negocio no encontrado en tu lista de negocios');
          }
          
          console.log('Business found in private list:', business);
          console.log('Business validation status:', business.validationStatus);
          console.log('Business photos:', business.photos);
          console.log('Business schedules:', business.schedules);
          
          return business;
        } else {
          console.error('Invalid response structure:', response);
          throw new Error('No se pudieron cargar tus negocios privados');
        }
      }),
      catchError((error) => {
        console.error('Error in getBusinessDetails:', error);
        
        if (error.message && error.message.includes('no encontrado')) {
          return throwError(() => error);
        }
        
        console.log('Trying alternative method...');
        return this.getBusinessDetailsAlternative(businessId);
      })
    );
  }

  getBusinessDetailsAlternative(businessId: number): Observable<Business> {
    console.log('Using alternative method for business ID:', businessId);
    
    const url = `${this.apiUrl}/business/public-details`;
    const params = { id: businessId.toString() };
    
    return this.http.get<Business>(url, {
      headers: this.getAuthHeaders(),
      params
    }).pipe(
      tap(business => {
        console.log('Alternative method - Business details response:', business);
        console.log('Alternative method - Business validation status:', business.validationStatus);
        console.log('Alternative method - Business photos:', business.photos);
        console.log('Alternative method - Business schedules:', business.schedules);
      }),
      catchError((error) => {
        console.error('Alternative method also failed:', error);
        
        let errorMessage = 'No se pudieron cargar los detalles del negocio';
        
        if (error.status === 403) {
          errorMessage = 'No tienes permisos para ver este negocio';
        } else if (error.status === 404) {
          errorMessage = 'El negocio no existe o ha sido eliminado';
        } else if (error.status === 401) {
          errorMessage = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente';
        }
        
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  updateBusiness(businessId: number, updateData: UpdateBusinessRequest, businessStatus?: string): Observable<any> {
    console.log('=== UPDATE BUSINESS SERVICE ===');
    console.log('Business ID:', businessId);
    console.log('Business Status:', businessStatus);
    console.log('Update Data:', updateData);
    
    if (!businessId || businessId <= 0) {
      console.error('Invalid business ID:', businessId);
      return throwError(() => new Error('ID de negocio inválido'));
    }

    if (!updateData || Object.keys(updateData).length === 0) {
      console.error('No update data provided');
      return throwError(() => new Error('No hay datos para actualizar'));
    }

    let headers: HttpHeaders;
    try {
      headers = this.getAuthHeaders();
      console.log('Headers created successfully');
    } catch (error) {
      console.error('Error creating auth headers:', error);
      return throwError(() => error);
    }

    let url: string;
    if (businessStatus === 'REJECTED') {
      url = `${this.businessUrl}/update-rejected/${businessId}`;
      console.log('Using rejected business endpoint');
    } else {
      url = `${this.businessUrl}/${businessId}`;
      console.log('Using standard business endpoint');
    }

    const cleanedData: any = {};
    
    if (updateData.commercialName !== undefined && updateData.commercialName !== null && updateData.commercialName.trim() !== '') {
      cleanedData.commercialName = updateData.commercialName.trim();
    }
    
    if (updateData.description !== undefined && updateData.description !== null) {
      cleanedData.description = updateData.description.trim();
    }
    
    if (updateData.email !== undefined && updateData.email !== null && updateData.email.trim() !== '') {
      const email = updateData.email.trim();
      if (!this.isValidEmail(email)) {
        return throwError(() => new Error('Formato de email inválido'));
      }
      cleanedData.email = email;
    }
    
    ['facebook', 'instagram', 'tiktok', 'website', 'whatsappNumber', 'address'].forEach(field => {
      const value = (updateData as any)[field];
      if (value !== undefined && value !== null && value.toString().trim() !== '') {
        (cleanedData as any)[field] = value.toString().trim();
      }
    });

    if (updateData.acceptsWhatsappOrders !== undefined) {
      cleanedData.acceptsWhatsappOrders = Boolean(updateData.acceptsWhatsappOrders);
    }

    if (updateData.googleMapsCoordinates !== undefined && updateData.googleMapsCoordinates !== null && updateData.googleMapsCoordinates.trim() !== '') {
      cleanedData.googleMapsCoordinates = updateData.googleMapsCoordinates.trim();
    }

    if (Object.keys(cleanedData).length === 0) {
      console.error('No valid data to send after cleaning');
      return throwError(() => new Error('No hay datos válidos para actualizar'));
    }
    
    console.log('=== MAKING UPDATE REQUEST ===');
    console.log('URL:', url);
    console.log('Method: PUT');
    console.log('Headers:', {
      'Authorization': headers.get('Authorization') ? 'Bearer [TOKEN_EXISTS]' : 'NO_TOKEN',
      'Content-Type': headers.get('Content-Type')
    });
    console.log('Cleaned Data:', JSON.stringify(cleanedData, null, 2));

    return this.http.put(url, cleanedData, { headers }).pipe(
      tap(response => {
        console.log('=== UPDATE SUCCESS ===');
        console.log('Update response:', response);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('=== UPDATE ERROR ===');
        console.error('Status:', error.status);
        console.error('Status Text:', error.statusText);
        console.error('Error Body:', error.error);
        console.error('Full Error:', error);
        
        let errorMessage = 'Error al actualizar el negocio';
        
        switch (error.status) {
          case 400:
            if (error.error?.message) {
              if (error.error.message.includes('DTO inválido')) {
                errorMessage = 'Formato de datos incorrecto. Verifica que todos los campos estén en el formato correcto.';
              } else {
                errorMessage = `Datos inválidos: ${error.error.message}`;
              }
            } else if (error.error?.errors && Array.isArray(error.error.errors)) {
              errorMessage = `Errores de validación: ${error.error.errors.join(', ')}`;
            } else {
              errorMessage = 'Datos inválidos. Verifica que todos los campos estén correctos.';
            }
            break;
            
          case 401:
            errorMessage = 'No autorizado. Tu sesión ha expirado, por favor inicia sesión nuevamente.';
            localStorage.removeItem('jwt_token');
            break;
            
          case 403:
            errorMessage = 'No tienes permisos para editar este negocio. Solo el propietario puede modificarlo.';
            break;
            
          case 404:
            errorMessage = 'El negocio no fue encontrado o ha sido eliminado.';
            break;
            
          case 422:
            errorMessage = 'Los datos enviados no pueden ser procesados. Verifica los campos requeridos.';
            break;
            
          case 500:
            errorMessage = 'Error interno del servidor. Inténtalo más tarde.';
            break;
            
          default:
            if (error.error?.message) {
              errorMessage = error.error.message;
            } else if (error.message) {
              errorMessage = error.message;
            }
        }
        
        console.log('Final error message:', errorMessage);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  getCategories(): Observable<any[]> {
    console.log('Getting categories');
    
    return this.http.get<any[]>(`${this.apiUrl}/categories`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(categories => console.log('Categories response:', categories)),
      catchError(this.handleError)
    );
  }

  getPhotoUrls(photos: any[]): string[] {
    console.log('Processing photos:', photos);
    
    if (!photos || !Array.isArray(photos)) {
      console.log('No photos available or photos is not an array');
      return [];
    }
    
    const urls = photos
      .map(photo => {
        const url = photo?.url || photo?.photoUrl || '';
        console.log('Photo object:', photo, 'Extracted URL:', url);
        return url;
      })
      .filter(url => url && url.trim() !== '');
    
    console.log('Extracted photo URLs:', urls);
    return urls;
  }

  getCoordinatesArray(coordinates: string): number[] {
    console.log('Processing coordinates:', coordinates);
    
    if (!coordinates) {
      console.log('No coordinates provided');
      return [0, 0];
    }
    
    const coords = coordinates.split(',').map(coord => parseFloat(coord.trim()));
    const result = coords.length === 2 ? coords : [0, 0];
    console.log('Processed coordinates:', result);
    return result;
  }

  formatSchedules(schedules: any[]): { day: string, hours: string }[] {
    console.log('Formatting schedules:', schedules);
    
    if (!schedules || !Array.isArray(schedules)) {
      console.log('No schedules available or schedules is not an array');
      return [];
    }
    
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    
    const formatted = schedules.map(schedule => {
      const day = (schedule?.dayOfWeek !== undefined && dayNames[schedule.dayOfWeek]) 
        ? dayNames[schedule.dayOfWeek] 
        : 'Día desconocido';
      const hours = schedule?.isClosed 
        ? 'Cerrado' 
        : `${schedule?.openTime || ''} - ${schedule?.closeTime || ''}`;
      
      console.log('Schedule processing:', { schedule, day, hours });
      return { day, hours };
    });
    
    console.log('Formatted schedules:', formatted);
    return formatted;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('HTTP Error occurred:', error);
    
    let errorMessage = 'Ha ocurrido un error inesperado';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 401:
          errorMessage = 'No autorizado. Por favor, inicia sesión nuevamente.';
          localStorage.removeItem('jwt_token');
          break;
        case 403:
          errorMessage = 'No tienes permisos para acceder a este recurso.';
          break;
        case 404:
          errorMessage = 'El recurso solicitado no fue encontrado.';
          break;
        case 500:
          errorMessage = 'Error interno del servidor. Inténtalo más tarde.';
          break;
        default:
          errorMessage = `Error ${error.status}: ${error.message}`;
      }
    }
    
    console.error('Error message:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}