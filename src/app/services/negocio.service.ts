import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class NegocioService {
  private apiUrl = environment.apiUrl;
  private businessUrl = `${this.apiUrl}/business`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (!token) {
      this.authService.logout();
      throw new Error('No authentication token available');
    }
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  createBusiness(formData: FormData): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http
      .post(`${this.businessUrl}/create`, formData, { headers })
      .pipe(
        catchError((error) => {
          if (error.status === 401) {
            this.authService.logout();
          }
          return throwError(() => new Error(this.getErrorMessage(error)));
        })
      );
  }

  // Método para actualizar negocio con archivos
  updateBusinessWithFiles(businessId: number, formData: FormData): Observable<any> {
    console.log('Updating business with files, ID:', businessId);
    
    if (!businessId || businessId <= 0) {
      return throwError(() => new Error('ID de negocio inválido'));
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.authService.getToken()}`,
      // No establecer Content-Type para FormData, el navegador lo hará automáticamente
    });

    // Usar el endpoint de actualización completa que maneja archivos
    return this.http
      .put(`${this.businessUrl}/update-complete/${businessId}`, formData, { headers })
      .pipe(
        catchError((error) => {
          console.error('Error updating business with files:', error);
          
          if (error.status === 401) {
            this.authService.logout();
          }
          
          let errorMessage = 'Error al actualizar el negocio';
          
          if (error.status === 400) {
            errorMessage = 'Datos inválidos. Verifica que todos los campos estén correctos.';
          } else if (error.status === 403) {
            errorMessage = 'No tienes permisos para editar este negocio.';
          } else if (error.status === 404) {
            errorMessage = 'El negocio no fue encontrado.';
          } else if (error.status === 413) {
            errorMessage = 'Los archivos son demasiado grandes.';
          } else if (error.status === 422) {
            errorMessage = 'Error de validación en el servidor.';
          } else if (error.status === 500) {
            errorMessage = 'Error del servidor. Intenta más tarde.';
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }
          
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  // Método alternativo para actualización de negocios rechazados específicamente
  updateRejectedBusiness(businessId: number, formData: FormData): Observable<any> {
    console.log('Updating rejected business with files, ID:', businessId);
    
    if (!businessId || businessId <= 0) {
      return throwError(() => new Error('ID de negocio inválido'));
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.authService.getToken()}`,
    });

    // Endpoint específico para negocios rechazados
    return this.http
      .put(`${this.businessUrl}/update-rejected/${businessId}`, formData, { headers })
      .pipe(
        catchError((error) => {
          console.error('Error updating rejected business:', error);
          
          if (error.status === 401) {
            this.authService.logout();
          }
          
          return throwError(() => new Error(this.getErrorMessage(error)));
        })
      );
  }

  getBusinessesByUser(
    category: string = '',
    page: number = 0,
    size: number = 10
  ): Observable<any> {
    const headers = this.getAuthHeaders();
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (category) {
      params = params.set('category', category);
    }

    return this.http
      .get<any>(`${this.businessUrl}/private-list-by-category`, {
        headers,
        params,
      })
      .pipe(
        map((response) => {
          // Procesa los datos para extraer el logo y añadir propiedades necesarias
          const processedData = {
            ...response.data,
            content: response.data.content.map((business: any) => ({
              ...business,
              logoUrl: this.extractLogoUrl(business.photos),
              active: business.validationStatus === 'VALIDATED',
              representativeName: business.user?.name || 'No especificado',
              email: business.user?.email || 'No especificado',
            })),
          };
          return processedData;
        }),
        catchError((error) => {
          if (error.status === 401) {
            this.authService.logout();
          }
          return throwError(() => new Error(this.getErrorMessage(error)));
        })
      );
  }

  // Método para solicitar eliminación de negocio
  requestBusinessDeletion(businessId: number, motivo: string, justificacion: string): Observable<any> {
    const headers = this.getAuthHeaders();
    let params = new HttpParams()
      .set('motivo', motivo)
      .set('justificacion', justificacion);

    return this.http
      .post(`${this.businessUrl}/deletion/${businessId}`, null, { headers, params })
      .pipe(
        catchError((error) => {
          if (error.status === 401) {
            this.authService.logout();
          }
          return throwError(() => new Error(this.getErrorMessage(error)));
        })
      );
  }

  getDeletionRequests(status: 'PENDING' | 'APPROVED' | 'REJECTED'): Observable<any> {
    const params = new HttpParams().set('status', status);

    return this.http
      .get<any>(`${this.businessUrl}/deletion`, {
        headers: this.getAuthHeaders(),
        params
      })
      .pipe(
        map((response) => {
          // Verificar si la respuesta es un array directo o tiene estructura anidada
          let deletionRequests = [];
          
          if (Array.isArray(response)) {
            deletionRequests = response;
          } else if (response?.data && Array.isArray(response.data)) {
            deletionRequests = response.data;
          } else if (response?.content && Array.isArray(response.content)) {
            deletionRequests = response.content;
          } else {
            deletionRequests = [];
          }

          // Mapear cada solicitud de eliminación con la estructura esperada
          return deletionRequests.map((deletion: any) => ({
            id: deletion.id || 0,
            businessName: deletion.businessName || deletion.business?.name || 'Sin nombre',
            motivo: deletion.motivo || deletion.reason || '',
            justificacion: deletion.justificacion || deletion.justification || '',
            status: deletion.status || 'PENDING',
            requestedBy: deletion.requestedBy || deletion.user?.name || deletion.userName || 'No especificado',
            createdAt: deletion.createdAt || deletion.requestDate || new Date().toISOString()
          }));
        }),
        catchError(this.handleError)
      );
  }

  private extractLogoUrl(photos: any[]): string {
    if (!photos || photos.length === 0) {
      return 'assets/icon/ibarra.jpg';
    }

    // Buscar logo
    const logo = photos.find((photo) => photo.photoType === 'LOGO');
    if (logo) return logo.url;

    // Si no hay logo, usar la primera imagen disponible
    return photos[0].url || 'assets/icon/ibarra.jpg';
  }

  getCategories(): Observable<any> {
    return this.http
      .get<any>(`${this.apiUrl}/businessCategories/select`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        catchError((error) =>
          throwError(() => new Error(this.getErrorMessage(error)))
        )
      );
  }

  getParishes(): Observable<any> {
    return this.http
      .get<any>(`${this.apiUrl}/business/list-parish`, {
      })
      .pipe(
        catchError((error) =>
          throwError(() => new Error(this.getErrorMessage(error)))
        )
      );
  }

  getListParish(type?: string): Observable<any> {
    const params = new HttpParams().set('type', type || '');

    return this.http
      .get<any>(`${this.apiUrl}/business/list-parish`, {
        params
      })
      .pipe(
        catchError((error) =>
          throwError(() => new Error(this.getErrorMessage(error)))
        )
      );
  }

  // MÉTODO HANDLEERROR QUE FALTABA
  private handleError = (error: any): Observable<never> => {
    console.error('Error en NegocioService:', error);
    
    // Si el error es 401, cerrar sesión
    if (error.status === 401) {
      this.authService.logout();
    }
    
    // Crear mensaje de error personalizado
    const errorMessage = this.getErrorMessage(error);
    
    return throwError(() => new Error(errorMessage));
  };

  private getErrorMessage(error: any): string {
    if (error.status === 401) {
      return 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.';
    } else if (error.status === 404) {
      return 'No se encontraron negocios.';
    } else if (error.status === 0) {
      return 'No hay conexión con el servidor.';
    }
    return 'Ocurrió un error al procesar la solicitud.';
  }
}