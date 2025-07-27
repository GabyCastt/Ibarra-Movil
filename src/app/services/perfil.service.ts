import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PerfilService {
  // Base URL del API
  private apiUrl = 'http://34.10.172.54:8080';

  constructor(private http: HttpClient) {}

  /**
   * Obtiene la información del perfil del usuario autenticado.
   * Reemplazar '/users/me' con el endpoint real.
   */
  getProfile(): Observable<any> {
    // TODO: actualizar el endpoint real del perfil
    return this.http.get(`${this.apiUrl}/users/me`);
  }

  /**
   * Envía los datos modificados del perfil al backend.
   * Reemplazar '/users/me' con el endpoint real para actualizar.
   */
  updateProfile(data: any): Observable<any> {
    // TODO: actualizar el endpoint real para guardar cambios
    return this.http.put(`${this.apiUrl}/users/me`, data);
  }
}
