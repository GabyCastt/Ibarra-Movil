import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  private apiUrl = 'http://34.10.172.54:8080';

  constructor(private http: HttpClient) {}

  /**
   * Lee correctamente el token almacenado por AuthService
   */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwt_token'); // ESTA ES LA CLAVE CORRECTA
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
