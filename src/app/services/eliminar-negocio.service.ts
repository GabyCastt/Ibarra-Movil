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

  // Solicitar eliminación de negocio
  requestBusinessDeletion(businessId: number, motivo: string, justificacion: string): Observable<any> {
    const params = new HttpParams()
      .set('motivo', motivo)
      .set('justificacion', justificacion);

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
          if (error.status === 409) {
            throw new Error('Ya existe una solicitud pendiente para este negocio');
          }
          return this.handleError(error);
        })
      );
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