import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface UpdateUserDto {
  phone?: string;
  email?: string;
  address?: string;
  username?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PerfilService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwt_token') || localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    });
  }

  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/whoami`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error en getProfile:', error);
        return throwError(() => error);
      })
    );
  }

  updateProfile(data: UpdateUserDto): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/update-user`, data, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error en updateProfile:', error);
        return throwError(() => error);
      })
    );
  }
}