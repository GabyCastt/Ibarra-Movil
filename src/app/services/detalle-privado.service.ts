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
      // No incluir Content-Type para FormData - el navegador lo establece automáticamente
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

  // Método para actualizar negocios estándar (solo JSON, sin archivos)
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

    // CAMBIO IMPORTANTE: Solo usar endpoint estándar para JSON sin archivos
    const url = `${this.businessUrl}/${businessId}`;
    console.log('Using standard business endpoint (JSON only)');

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

  // Método para actualizar negocios rechazados con archivos
  updateRejectedBusinessWithFiles(businessId: number, formData: FormData): Observable<any> {
    console.log('=== UPDATE REJECTED BUSINESS WITH FILES ===');
    console.log('Business ID:', businessId);
    
    if (!businessId || businessId <= 0) {
      return throwError(() => new Error('ID de negocio inválido'));
    }

    let headers: HttpHeaders;
    try {
      headers = this.getAuthHeadersForFormData();
      console.log('Headers created for rejected business update');
    } catch (error) {
      console.error('Error creating auth headers:', error);
      return throwError(() => error);
    }

    const url = `${this.businessUrl}/update-rejected/${businessId}`;
    
    console.log('=== MAKING REJECTED BUSINESS UPDATE REQUEST ===');
    console.log('URL:', url);
    this.logFormData(formData, 'REJECTED BUSINESS FORM DATA');

    return this.http.put(url, formData, { headers }).pipe(
      tap(response => {
        console.log('=== REJECTED BUSINESS UPDATE SUCCESS ===');
        console.log('Response:', response);
      }),
      catchError(this.handleRejectedUpdateError.bind(this))
    );
  }

  // MÉTODO UNIFICADO CORREGIDO - Maneja correctamente cada tipo de negocio
  updateBusinessUnified(businessId: number, businessStatus: string, updateData?: UpdateBusinessRequest, formData?: FormData): Observable<any> {
    console.log('=== UNIFIED BUSINESS UPDATE ===');
    console.log('Business ID:', businessId, 'Status:', businessStatus);
    console.log('Has FormData:', !!formData, 'Has UpdateData:', !!updateData);

    if (businessStatus === 'REJECTED') {
      // Para negocios rechazados, usar endpoint específico (puede recibir FormData)
      if (formData) {
        return this.updateRejectedBusinessWithFiles(businessId, formData);
      } else if (updateData) {
        const url = `${this.businessUrl}/update-rejected/${businessId}`;
        const headers = this.getAuthHeaders();
        const cleanedData = this.cleanUpdateData(updateData);
        
        return this.http.put(url, cleanedData, { headers }).pipe(
          tap(response => console.log('Rejected business updated (no files):', response)),
          catchError(this.handleUpdateError.bind(this))
        );
      }
    } else {
      // Para negocios VALIDATED, APPROVED, PENDING: Solo JSON, NO FormData
      if (formData) {
        console.log('WARNING: Cannot send files to validated/approved businesses - using JSON only');
        // Extraer datos JSON del FormData y enviar sin archivos
        return this.extractDataFromFormDataAndUpdate(businessId, formData);
      } else if (updateData) {
        // Usar endpoint estándar con JSON únicamente
        return this.updateBusiness(businessId, updateData, businessStatus);
      }
    }
    
    return throwError(() => new Error('Configuración de actualización inválida'));
  }

  // NUEVO MÉTODO: Extraer datos del FormData y enviar como JSON
  private extractDataFromFormDataAndUpdate(businessId: number, formData: FormData): Observable<any> {
    console.log('=== EXTRACTING DATA FROM FORMDATA FOR VALIDATED BUSINESS ===');
    
    // Obtener el blob de business data del FormData
    const businessBlob = formData.get('business');
    
    if (!businessBlob || !(businessBlob instanceof Blob)) {
      return throwError(() => new Error('No se encontraron datos de negocio en el FormData'));
    }

    return new Observable(observer => {
      const reader = new FileReader();
      
      reader.onload = () => {
        try {
          const businessData = JSON.parse(reader.result as string);
          console.log('Extracted business data:', businessData);
          
          // Convertir a UpdateBusinessRequest format
          const updateRequest: UpdateBusinessRequest = {
            categoryId: businessData.categoryId,
            commercialName: businessData.commercialName,
            phone: businessData.phone,
            website: businessData.website || '',
            description: businessData.description,
            parishCommunitySector: businessData.parishCommunitySector,
            acceptsWhatsappOrders: businessData.acceptsWhatsappOrders,
            whatsappNumber: businessData.whatsappNumber || '',
            googleMapsCoordinates: businessData.googleMapsCoordinates,
            deliveryService: businessData.deliveryService,
            salePlace: businessData.salePlace,
            receivedUdelSupport: businessData.receivedUdelSupport,
            udelSupportDetails: businessData.udelSupportDetails || '',
            parishId: businessData.parishId,
            facebook: businessData.facebook || '',
            instagram: businessData.instagram || '',
            tiktok: businessData.tiktok || '',
            address: businessData.address,
            schedules: businessData.schedules,
            productsServices: businessData.productsServices,
            email: businessData.email || ''
          };

          // Enviar como actualización JSON estándar
          this.updateBusiness(businessId, updateRequest).subscribe({
            next: (response) => {
              observer.next(response);
              observer.complete();
            },
            error: (error) => {
              observer.error(error);
            }
          });

        } catch (error) {
          console.error('Error parsing business data from FormData:', error);
          observer.error(new Error('Error al procesar los datos del negocio'));
        }
      };

      reader.onerror = () => {
        observer.error(new Error('Error al leer los datos del FormData'));
      };

      reader.readAsText(businessBlob);
    });
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

  // MÉTODO MEJORADO PARA EXTRAER URLs DE FOTOS MÚLTIPLES
  getPhotoUrls(photos: any[]): string[] {
    console.log('🖼️ Processing photos for URLs:', photos);
    
    if (!photos || !Array.isArray(photos)) {
      console.log('❌ No photos available or photos is not an array');
      return [];
    }
    
    const urls: string[] = [];
    
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      console.log(`📸 Processing photo ${i + 1}:`, photo);
      
      // Intentar múltiples propiedades posibles para la URL
      let url = '';
      
      if (typeof photo === 'string' && photo.startsWith('http')) {
        // Si el photo es directamente una string URL
        url = photo;
      } else if (typeof photo === 'object' && photo !== null) {
        // Si es un objeto, buscar la URL en varias propiedades
        url = photo.url || 
              photo.photoUrl || 
              photo.imageUrl || 
              photo.src || 
              photo.path || 
              photo.link ||
              photo.href ||
              '';
              
        // Si tiene un objeto nested con URL
        if (!url && photo.image) {
          url = photo.image.url || photo.image.src || '';
        }
        
        // Si tiene metadata con URL
        if (!url && photo.metadata) {
          url = photo.metadata.url || photo.metadata.src || '';
        }
      }
      
      // Validar que la URL sea válida
      if (url && 
          typeof url === 'string' && 
          url.trim() !== '' && 
          (url.startsWith('http://') || url.startsWith('https://'))) {
        
        urls.push(url.trim());
        console.log(`✅ Valid URL found for photo ${i + 1}: ${url.substring(0, 50)}...`);
      } else {
        console.log(`❌ No valid URL found for photo ${i + 1}:`, photo);
      }
    }
    
    console.log(`🎯 Total valid photo URLs extracted: ${urls.length}/${photos.length}`);
    console.log('📋 Final URLs:', urls.map((url, i) => `${i + 1}: ${url.substring(0, 50)}...`));
    
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

  // Método corregido para evitar errores de TypeScript
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
    
    // Procesar campos de texto - CORREGIDO
    const textFields = ['facebook', 'instagram', 'tiktok', 'website', 'whatsappNumber', 'address', 'phone', 'parishCommunitySector', 'productsServices', 'deliveryService', 'salePlace', 'schedules', 'udelSupportDetails'];
    
    textFields.forEach(field => {
      const value = (updateData as any)[field];
      
      // Verificación de tipo más explícita
      if (value !== undefined && 
          value !== null && 
          (typeof value === 'string' || typeof value === 'number') && 
          String(value).trim() !== '') {
        
        (cleanedData as any)[field] = String(value).trim();
      }
    });

    // Procesar campos booleanos
    if (typeof updateData.acceptsWhatsappOrders === 'boolean') {
      cleanedData.acceptsWhatsappOrders = updateData.acceptsWhatsappOrders;
    }

    if (typeof updateData.receivedUdelSupport === 'boolean') {
      cleanedData.receivedUdelSupport = updateData.receivedUdelSupport;
    }

    // Procesar IDs
    if (updateData.categoryId !== undefined && updateData.categoryId !== null) {
      cleanedData.categoryId = updateData.categoryId;
    }

    if (updateData.parishId !== undefined && updateData.parishId !== null && typeof updateData.parishId === 'number') {
      cleanedData.parishId = updateData.parishId;
    }

    if (updateData.googleMapsCoordinates !== undefined && 
        updateData.googleMapsCoordinates !== null && 
        typeof updateData.googleMapsCoordinates === 'string' &&
        updateData.googleMapsCoordinates.trim() !== '') {
      cleanedData.googleMapsCoordinates = updateData.googleMapsCoordinates.trim();
    }

    return cleanedData;
  }

  private logFormData(formData: FormData, title: string): void {
    console.log(`=== ${title} ===`);
    
    try {
      const entries: string[] = [];
      
      const expectedFields = [
        'logoFile',
        'carrouselPhotos', 
        'business'
      ];
      
      expectedFields.forEach(field => {
        try {
          const value = formData.get(field);
          if (value !== null) {
            if (this.isFile(value)) {
              entries.push(`${field}: File(${value.name}, ${value.size} bytes, ${value.type})`);
            } else if (this.isBlob(value)) {
              entries.push(`${field}: JSON Blob (${value.size} bytes)`);
            } else if (typeof value === 'string') {
              entries.push(`${field}: ${value}`);
            } else {
              entries.push(`${field}: ${String(value)}`);
            }
          }
        } catch (fieldError) {
          console.log(`Error processing field ${field}:`, fieldError);
        }
      });
      
      try {
        const carrouselFiles = formData.getAll('carrouselPhotos');
        if (carrouselFiles && carrouselFiles.length > 0) {
          entries.push(`carrouselPhotos count: ${carrouselFiles.length}`);
          carrouselFiles.forEach((file, index) => {
            if (this.isFile(file)) {
              entries.push(`carrouselPhotos[${index}]: File(${file.name}, ${file.size} bytes, ${file.type})`);
            }
          });
        }
      } catch (carrouselError) {
        console.log('Error processing carousel files:', carrouselError);
      }
      
      console.log('FormData content:', entries);
      
    } catch (error) {
      console.log('FormData debugging error:', error);
      console.log('FormData object exists:', typeof formData === 'object' && formData instanceof FormData);
    }
  }

  private isFile(value: any): value is File {
    return value instanceof File;
  }

  private isBlob(value: any): value is Blob {
    return value instanceof Blob && !(value instanceof File);
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

  private handleRejectedUpdateError(error: HttpErrorResponse): Observable<never> {
    console.error('=== REJECTED BUSINESS UPDATE ERROR ===');
    console.error('Status:', error.status);
    console.error('Error Body:', error.error);
    
    let errorMessage = 'Error al actualizar el negocio rechazado';
    
    switch (error.status) {
      case 400:
        if (error.error?.message) {
          errorMessage = `Error de validación: ${error.error.message}`;
        } else {
          errorMessage = 'Datos inválidos. Verifica que todos los campos estén correctos.';
        }
        break;
      case 401:
        errorMessage = 'No autorizado. Tu sesión ha expirado.';
        localStorage.removeItem('jwt_token');
        break;
      case 403:
        errorMessage = 'No tienes permisos para editar este negocio rechazado.';
        break;
      case 404:
        errorMessage = 'El negocio rechazado no fue encontrado.';
        break;
      case 422:
        if (error.error?.message) {
          errorMessage = `Error de procesamiento: ${error.error.message}`;
        } else {
          errorMessage = 'Error de validación. El negocio regresará a estado PENDING una vez corregido.';
        }
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