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
        map((response) => response.data),
        catchError((error) => {
          if (error.status === 401) {
            this.authService.logout();
          }
          return throwError(() => new Error(this.getErrorMessage(error)));
        })
      );
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
