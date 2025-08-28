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
  parish?: {
    id: number;
    name: string;
    type: string;
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
  receivedUdelSupport?: boolean;
  udelSupportDetails?: string;
  productsServices?: string;
  validationStatus: string;
  registrationDate: string;
  googleMapsCoordinates?: string;
  schedules?: any[];
  photos?: any[];
  user?: {
    id: number;
    name: string;
    email?: string;
  };
  rejectionReason?: string;
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
  phone?: string;
  deliveryService?: string;
  salePlace?: string;
  parishCommunitySector?: string;
  productsServices?: string;
  categoryId?: string;
  parishId?: number;
  receivedUdelSupport?: boolean;
  udelSupportDetails?: string;
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

  private getAuthHeadersForFormData(): HttpHeaders {
    const token = localStorage.getItem('jwt_token');
    
    if (!token) {
      throw new Error('No authentication token available');
    }
    
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
      // No incluir Content-Type para FormData
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
      catchError(this.handleError.bind(this))
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

    const cleanedData = this.cleanUpdateData(updateData);

    if (Object.keys(cleanedData).length === 0) {
      console.error('No valid data to send after cleaning');
      return throwError(() => new Error('No hay datos válidos para actualizar'));
    }
    
    console.log('=== MAKING UPDATE REQUEST ===');
    console.log('URL:', url);
    console.log('Cleaned Data:', JSON.stringify(cleanedData, null, 2));

    return this.http.put(url, cleanedData, { headers }).pipe(
      tap(response => {
        console.log('=== UPDATE SUCCESS ===');
        console.log('Update response:', response);
      }),
      catchError(this.handleUpdateError.bind(this))
    );
  }

  // Método para actualizar negocio con archivos completos
  updateBusinessWithFiles(businessId: number, formData: FormData): Observable<any> {
    console.log('=== UPDATE BUSINESS WITH FILES ===');
    console.log('Business ID:', businessId);
    
    if (!businessId || businessId <= 0) {
      return throwError(() => new Error('ID de negocio inválido'));
    }

    let headers: HttpHeaders;
    try {
      headers = this.getAuthHeadersForFormData();
      console.log('FormData headers created successfully');
    } catch (error) {
      console.error('Error creating auth headers:', error);
      return throwError(() => error);
    }

    // Endpoint específico para actualización completa con archivos
    const url = `${this.businessUrl}/update-complete/${businessId}`;
    
    console.log('=== MAKING UPDATE WITH FILES REQUEST ===');
    console.log('URL:', url);

    return this.http.put(url, formData, { headers }).pipe(
      tap(response => {
        console.log('=== UPDATE WITH FILES SUCCESS ===');
        console.log('Update response:', response);
      }),
      catchError(this.handleFileUpdateError.bind(this))
    );
  }

  getCategories(): Observable<any[]> {
    console.log('Getting categories');
    
    return this.http.get<any[]>(`${this.apiUrl}/businessCategories/select`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(categories => console.log('Categories response:', categories)),
      catchError(this.handleError.bind(this))
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

  // Método para validar archivos antes de envío
  validateFile(file: File, type: 'logo' | 'carousel'): Promise<{ isValid: boolean; error?: string }> {
    return new Promise((resolve) => {
      const allowedExtensions = ['jpg', 'jpeg', 'png'];
      const maxSize = 2 * 1024 * 1024; // 2MB
      
      const extension = file.name.split('.').pop()?.toLowerCase();
      
      if (!extension || !allowedExtensions.includes(extension)) {
        resolve({ isValid: false, error: `Formato no permitido para ${file.name}. Solo JPG o PNG` });
        return;
      }

      if (file.size > maxSize) {
        resolve({ isValid: false, error: `El archivo ${file.name} supera los 2 MB` });
        return;
      }

      // Validar dimensiones
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        if (img.width >= 800 && img.height >= 600) {
          resolve({ isValid: true });
        } else {
          resolve({ isValid: false, error: `${file.name} debe tener mínimo 800x600 píxeles` });
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ isValid: false, error: `Error al procesar ${file.name}` });
      };

      img.src = url;
    });
  }

  // Método para preparar FormData completo para actualización
  prepareUpdateFormData(businessData: any, logoFile?: File, carrouselPhotos?: File[]): FormData {
    const formData = new FormData();

    // Agregar archivos si existen
    if (logoFile) {
      formData.append('logoFile', logoFile);
      console.log('Logo file added to FormData:', logoFile.name);
    }

    if (carrouselPhotos && carrouselPhotos.length > 0) {
      carrouselPhotos.forEach((file, index) => {
        formData.append('carrouselPhotos', file);
        console.log(`Carousel photo ${index + 1} added:`, file.name);
      });
    }

    // Agregar datos del negocio
    const businessBlob = new Blob([JSON.stringify(businessData)], { type: 'application/json' });
    formData.append('business', businessBlob);

    console.log('Business data added to FormData:', JSON.stringify(businessData, null, 2));

    return formData;
  }

  // Método para validar coordenadas
  validateCoordinates(coordinates: string): boolean {
    if (!coordinates) return false;

    const coordRegex = /^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*$/;
    if (!coordRegex.test(coordinates)) return false;

    const [lat, lng] = coordinates.split(',').map(coord => parseFloat(coord.trim()));
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  // Método para validar horarios
  validateScheduleFormat(schedule: string): boolean {
    if (!schedule) return false;
    const scheduleRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]\s*[-a]\s*([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return scheduleRegex.test(schedule.trim());
  }

  // Método para validar teléfono ecuatoriano
  validateEcuadorianPhone(phone: string): boolean {
    if (phone.length !== 9) return false;
    const firstDigit = phone.charAt(0);
    return ['2', '3', '4', '5', '6', '7', '9'].includes(firstDigit);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private cleanUpdateData(updateData: UpdateBusinessRequest): any {
    const cleanedData: any = {};
    
    if (updateData.commercialName !== undefined && updateData.commercialName !== null && updateData.commercialName.trim() !== '') {
      cleanedData.commercialName = updateData.commercialName.trim();
    }
    
    if (updateData.description !== undefined && updateData.description !== null) {
      cleanedData.description = updateData.description.trim();
    }
    
    if (updateData.email !== undefined && updateData.email !== null && updateData.email.trim() !== '') {
      const email = updateData.email.trim();
      if (this.isValidEmail(email)) {
        cleanedData.email = email;
      }
    }
    
    // Procesar campos de texto
    ['facebook', 'instagram', 'tiktok', 'website', 'whatsappNumber', 'address', 'phone', 'parishCommunitySector', 'productsServices', 'deliveryService', 'salePlace', 'schedules', 'udelSupportDetails'].forEach(field => {
      const value = (updateData as any)[field];
      if (value !== undefined && value !== null && value.toString().trim() !== '') {
        (cleanedData as any)[field] = value.toString().trim();
      }
    });

    // Procesar campos booleanos
    if (updateData.acceptsWhatsappOrders !== undefined) {
      cleanedData.acceptsWhatsappOrders = Boolean(updateData.acceptsWhatsappOrders);
    }

    if (updateData.receivedUdelSupport !== undefined) {
      cleanedData.receivedUdelSupport = Boolean(updateData.receivedUdelSupport);
    }

    // Procesar IDs
    if (updateData.categoryId !== undefined && updateData.categoryId !== null) {
      cleanedData.categoryId = updateData.categoryId;
    }

    if (updateData.parishId !== undefined && updateData.parishId !== null) {
      cleanedData.parishId = updateData.parishId;
    }

    if (updateData.googleMapsCoordinates !== undefined && updateData.googleMapsCoordinates !== null && updateData.googleMapsCoordinates.trim() !== '') {
      cleanedData.googleMapsCoordinates = updateData.googleMapsCoordinates.trim();
    }

    return cleanedData;
  }

  private handleUpdateError(error: HttpErrorResponse): Observable<never> {
    console.error('=== UPDATE ERROR ===');
    console.error('Status:', error.status);
    console.error('Error Body:', error.error);
    
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
  }

  private handleFileUpdateError(error: HttpErrorResponse): Observable<never> {
    console.error('=== UPDATE WITH FILES ERROR ===');
    console.error('Status:', error.status);
    console.error('Error Body:', error.error);
    
    let errorMessage = 'Error al actualizar el negocio con archivos';
    
    switch (error.status) {
      case 400:
        errorMessage = 'Datos o archivos inválidos. Verifica el formato y tamaño de las imágenes.';
        break;
      case 401:
        errorMessage = 'No autorizado. Tu sesión ha expirado.';
        localStorage.removeItem('jwt_token');
        break;
      case 403:
        errorMessage = 'No tienes permisos para editar este negocio.';
        break;
      case 404:
        errorMessage = 'El negocio no fue encontrado.';
        break;
      case 413:
        errorMessage = 'Los archivos son demasiado grandes. Reduce el tamaño de las imágenes.';
        break;
      case 422:
        errorMessage = 'Error de validación. Verifica que las imágenes cumplan los requisitos.';
        break;
      case 500:
        errorMessage = 'Error del servidor. Intenta más tarde.';
        break;
      default:
        if (error.error?.message) {
          errorMessage = error.error.message;
        }
    }
    
    return throwError(() => new Error(errorMessage));
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