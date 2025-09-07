import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';
import { catchError, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EditarNegocioService {
  private apiUrl = environment.apiUrl;
  private businessUrl = `${this.apiUrl}/business`;

  constructor(private http: HttpClient, private authService: AuthService) { }

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

  updateBusiness(businessId: number, formData: FormData) {
    const headers = this.getAuthHeaders();
    return this.http
      .put(`${this.businessUrl}/update-rejected/${businessId}`, formData, { headers })
      .pipe(
        catchError((error) => {
          return throwError(() => new Error(`Error updating business: ${error.message}`));
        })
      );
  }

  
}
