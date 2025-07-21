import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RegisterUserRequest {
  email: string;
  name: string;
  lastname: string;
  identification: string;
  phone: string;
  address: string;
  username: string;
  password: string;
}

export interface CreateAdminRequest {
  email: string;
  name: string;
  lastname: string;
  identification: string;
  phone: string;
  address: string;
  username: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class RegistroAppService {
  private apiUrl = 'http://34.10.172.54:8080';

  constructor(private http: HttpClient) { }

  // Registrar usuario normal
  registerUser(userData: RegisterUserRequest): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    // Validar que todos los campos requeridos estén presentes
    const requestData = {
      email: userData.email?.trim() || '',
      name: userData.name?.trim() || '',
      lastname: userData.lastname?.trim() || '',
      identification: userData.identification?.trim() || '',
      phone: userData.phone?.trim() || '',
      address: userData.address?.trim() || '',
      username: userData.username?.trim() || '',
      password: userData.password?.trim() || ''
    };

    console.log('Enviando datos de registro:', requestData);
    
    // CAMBIO CLAVE: texto plano como respuesta
    return this.http.post(`${this.apiUrl}/users/register`, requestData, { 
      headers,
      responseType: 'text' // importante para que el backend pueda enviar texto plano
    });
  }

  // Crear nuevo administrador
  createNewAdmin(adminData: CreateAdminRequest): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    // Validar campos requeridos estén presentes
    const requestData = {
      email: adminData.email?.trim() || '',
      name: adminData.name?.trim() || '',
      lastname: adminData.lastname?.trim() || '',
      identification: adminData.identification?.trim() || '',
      phone: adminData.phone?.trim() || '',
      address: adminData.address?.trim() || '',
      username: adminData.username?.trim() || '',
      password: adminData.password?.trim() || ''
    };

    console.log('Enviando datos de admin:', requestData);
    
    // CAMBIO CLAVE: texto plano como respuesta
    return this.http.post(`${this.apiUrl}/users/create-new-admin`, requestData, { 
      headers,
      responseType: 'text' 
    });
  }
}