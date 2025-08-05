import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
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

  /**
   * Lee correctamente el token almacenado por AuthService
   */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwt_token'); 
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    });
  }

  /**
   * Obtener perfil del usuario autenticado
   */
  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/whoami`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Actualiza el perfil con los datos permitidos
   */
  updateProfile(data: UpdateUserDto): Observable<any> {
    const updateData: UpdateUserDto = {
      ...(data.phone && { phone: data.phone }),
      ...(data.email && { email: data.email }),
      ...(data.address && { address: data.address }),
      ...(data.username && { username: data.username })
    };

    return this.http.put(`${this.apiUrl}/users/updateUser`, updateData, {
      headers: this.getAuthHeaders()
    });
  }
}
