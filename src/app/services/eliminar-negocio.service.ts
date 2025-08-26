import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';

export interface DeletionRequest {
  id: number;
  businessName: string;
  motivo: string;
  justificacion: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedBy: string;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class NegocioService {
  private readonly apiUrl = environment.apiUrl;
  private readonly businessUrl = `${this.apiUrl}/business`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (!token) {
      this.authService.logout();
      throw new Error('No authentication token available');
    }
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  private handleError = (error: any) => {
    console.error('API Error:', error);
    if (error.status === 401) {
      this.authService.logout();
    }
    return throwError(() => new Error(this.getErrorMessage(error)));
  };

  createBusiness(formData: FormData): Observable<any> {
    return this.http
      .post(`${this.businessUrl}/create`, formData, {
        headers: this.getAuthHeaders()
      })
      .pipe(catchError(this.handleError));
  }

  // CORREGIDO: Listar todos los negocios (para el modal de selección)
  getAllBusinesses(page = 0, size = 10, category = ''): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('category', category);

    return this.http
      .get<any>(`${this.businessUrl}/list`, {
        headers: this.getAuthHeaders(),
        params,
      })
      .pipe(
        map((response) => {
          // Asumiendo que la API devuelve una estructura con content
          if (response?.content) {
            return {
              ...response,
              content: response.content.map((business: any) => ({
                id: business.id,
                name: business.name,
                category: business.category,
                logoUrl: this.extractLogoUrl(business.photos),
                active: business.validationStatus === 'VALIDATED',
                representativeName: business.user?.name || 'No especificado',
                email: business.user?.email || 'No especificado',
              }))
            };
          }
          return response;
        }),
        catchError(this.handleError)
      );
  }

  getBusinessesByUser(category = '', page = 0, size = 10): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('category', category);

    return this.http
      .get<any>(`${this.businessUrl}/private-list-by-category`, {
        headers: this.getAuthHeaders(),
        params,
      })
      .pipe(
        map((response) => ({
          ...response.data,
          content: response.data.content.map((business: any) => ({
            ...business,
            logoUrl: this.extractLogoUrl(business.photos),
            active: business.validationStatus === 'VALIDATED',
            representativeName: business.user?.name || 'No especificado',
            email: business.user?.email || 'No especificado',
          })),
        })),
        catchError(this.handleError)
      );
  }

  // CORREGIDO: Solicitar eliminación de negocio
  requestBusinessDeletion(businessId: number, motivo: string, justificacion: string): Observable<any> {
    const params = new HttpParams()
      .set('motivo', motivo)
      .set('justificacion', justificacion);

    // CORREGIDO: Usar el businessId en la URL como muestra tu API
    return this.http
      .post(`${this.businessUrl}/deletion/${businessId}`, null, {
        headers: this.getAuthHeaders(),
        params
      })
      .pipe(
        map((response) => {
          console.log('Deletion request response:', response);
          return response;
        }),
        catchError((error) => {
          console.error('Error requesting deletion:', error);
          // Manejo específico para error 409 (Conflict)
          if (error.status === 409) {
            throw new Error('Ya existe una solicitud pendiente para este negocio');
          }
          return this.handleError(error);
        })
      );
  }

  // CORREGIDO: Listar solicitudes de eliminación por estado
  getDeletionRequests(status?: 'PENDING' | 'APPROVED' | 'REJECTED'): Observable<DeletionRequest[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }

    return this.http
      .get<any>(`${this.businessUrl}/deletion`, {
        headers: this.getAuthHeaders(),
        params
      })
      .pipe(
        map((response) => {
          console.log('Deletion requests response:', response);
          
          // Si la respuesta es un array directamente
          if (Array.isArray(response)) {
            return response.map((deletion: any) => ({
              id: deletion.id,
              businessName: deletion.businessName || deletion.business?.name || 'Sin nombre',
              motivo: deletion.motivo,
              justificacion: deletion.justificacion,
              status: deletion.status,
              requestedBy: deletion.requestedBy || deletion.user?.name || 'Usuario desconocido',
              createdAt: deletion.createdAt || deletion.requestDate
            }));
          }
          
          // Si la respuesta tiene estructura con data o content
          if (response?.data) {
            const data = Array.isArray(response.data) ? response.data : response.data.content || [];
            return data.map((deletion: any) => ({
              id: deletion.id,
              businessName: deletion.businessName || deletion.business?.name || 'Sin nombre',
              motivo: deletion.motivo,
              justificacion: deletion.justificacion,
              status: deletion.status,
              requestedBy: deletion.requestedBy || deletion.user?.name || 'Usuario desconocido',
              createdAt: deletion.createdAt || deletion.requestDate
            }));
          }
          
          return [];
        }),
        catchError(this.handleError)
      );
  }

  // NUEVO: Obtener detalles de una solicitud específica
  getDeletionRequestById(id: number): Observable<DeletionRequest> {
    return this.http
      .get<any>(`${this.businessUrl}/deletion/${id}`, {
        headers: this.getAuthHeaders()
      })
      .pipe(
        map((deletion: any) => ({
          id: deletion.id,
          businessName: deletion.businessName || deletion.business?.name || 'Sin nombre',
          motivo: deletion.motivo,
          justificacion: deletion.justificacion,
          status: deletion.status,
          requestedBy: deletion.requestedBy || deletion.user?.name || 'Usuario desconocido',
          createdAt: deletion.createdAt || deletion.requestDate
        })),
        catchError(this.handleError)
      );
  }

  // NUEVO: Aprobar/Rechazar solicitud (si eres admin)
  updateDeletionRequestStatus(id: number, status: 'APPROVED' | 'REJECTED', comments?: string): Observable<any> {
    const body = {
      status,
      comments: comments || ''
    };

    return this.http
      .put(`${this.businessUrl}/deletion/${id}`, body, {
        headers: this.getAuthHeaders()
      })
      .pipe(catchError(this.handleError));
  }

  getCategories(): Observable<any> {
    return this.http
      .get<any>(`${this.apiUrl}/businessCategories/select`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  private extractLogoUrl(photos: any[]): string {
    if (!photos?.length) return 'assets/icon/ibarra.jpg';
    const logo = photos.find(photo => photo.photoType === 'LOGO');
    return logo?.url || photos[0]?.url || 'assets/icon/ibarra.jpg';
  }

  private getErrorMessage(error: any): string {
    const errorMessages: { [key: number]: string } = {
      0: 'No hay conexión con el servidor',
      400: 'Datos inválidos en la solicitud',
      401: 'Tu sesión ha expirado. Inicia sesión nuevamente',
      403: 'No tienes permisos para realizar esta acción',
      404: 'No se encontraron registros',
      409: 'Ya existe una solicitud pendiente para este negocio',
      422: 'Error en los datos proporcionados',
      500: 'Error interno del servidor'
    };
        
    return errorMessages[error.status] ||
           error.error?.message ||
           error.message ||
           'Error al procesar la solicitud';
  }
}