import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
   private apiUrl = environment.apiUrl;

  private loginUrl = `${this.apiUrl}/auth/login`;
  private validateEmailUrl = `${this.apiUrl}/recovery/email/validation`;
  private validateOTPUrl = `${this.apiUrl}/recovery/otp/validation`;
  private resetPasswordUrl = `${this.apiUrl}/recovery/password`;
  
  private authState = new BehaviorSubject<boolean>(false);
  isAuthenticated$ = this.authState.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.checkAuthState();
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(this.loginUrl, {
      username: email,
      password: password
    }).pipe(
      tap(response => {
        if (response?.jwt) { 
          this.storeAuthData(response);
          this.authState.next(true);
        }
      }),
      catchError(error => {
        let errorMsg = 'Error desconocido';
        if (error.status === 401) {
          errorMsg = 'Credenciales incorrectas';
        } else if (error.status === 0) {
          errorMsg = 'No hay conexión con el servidor';
        }
        throw new Error(errorMsg);
      })
    );
  }

  validateEmail(email: string): Observable<any> {
    return this.http.post<any>(this.validateEmailUrl, {
      email: email
    }).pipe(
      catchError(error => {
        let errorMsg = 'Error al validar el correo';
        if (error.status === 404) {
          errorMsg = 'El correo electrónico no está registrado en nuestro sistema';
        } else if (error.status === 400) {
          errorMsg = 'Formato de correo inválido';
        } else if (error.status === 0) {
          errorMsg = 'No hay conexión con el servidor';
        }
        throw new Error(errorMsg);
      })
    );
  }

  validateOTP(otp: string, uuid: string): Observable<any> {
    console.log('=== ENVIANDO VALIDACIÓN OTP ===');
    console.log('OTP:', otp);
    console.log('UUID:', uuid);
    console.log('URL:', this.validateOTPUrl);
    console.log('Body:', { otp, uuid });
    
    return this.http.post<any>(this.validateOTPUrl, {
      otp: otp,
      uuid: uuid
    }).pipe(
      tap(response => {
        console.log('=== RESPUESTA CRUDA DE OTP ===');
        console.log('Response completo:', response);
        console.log('Tipo:', typeof response);
        console.log('Es null/undefined?', response == null);
        if (response) {
          console.log('Keys:', Object.keys(response));
          console.log('Values:', Object.values(response));
        }
      }),
      catchError(error => {
        console.error('=== ERROR EN VALIDACIÓN OTP ===');
        console.error('Error completo:', error);
        console.error('Status:', error.status);
        console.error('Body:', error.error);
        
        let errorMsg = 'Error al validar el código';
        if (error.status === 400) {
          errorMsg = 'Código inválido o expirado';
        } else if (error.status === 404) {
          errorMsg = 'Código no encontrado';
        } else if (error.status === 0) {
          errorMsg = 'No hay conexión con el servidor';
        }
        throw new Error(errorMsg);
      })
    );
  }

  resetPassword(userId: any, newPassword: string): Observable<any> {
    console.log('Enviando petición a:', `${this.resetPasswordUrl}/${userId}`);
    console.log('Con body:', { newPassword });
    
    return this.http.put<any>(`${this.resetPasswordUrl}/${userId}`, {
      newPassword: newPassword
    }).pipe(
      tap(response => {
        console.log('Respuesta del servidor:', response);
      }),
      catchError(error => {
        console.error('Error del servidor:', error);
        let errorMsg = 'Error al cambiar la contraseña';
        if (error.status === 400) {
          errorMsg = 'La contraseña no cumple con los requisitos mínimos';
        } else if (error.status === 404) {
          errorMsg = 'Usuario no encontrado o sesión expirada';
        } else if (error.status === 500) {
          errorMsg = 'Error interno del servidor. Intente nuevamente.';
        } else if (error.status === 0) {
          errorMsg = 'No hay conexión con el servidor';
        }
        throw new Error(errorMsg);
      })
    );
  }

  private storeAuthData(response: any): void {
    localStorage.setItem('jwt_token', response.jwt);
    localStorage.setItem('user_data', JSON.stringify(response));
  }

  private checkAuthState(): void {
    const isAuthenticated = !!localStorage.getItem('jwt_token');
    this.authState.next(isAuthenticated);
  }

  isAuthenticated(): boolean {
    return this.authState.value;
  }

  logout(): void {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_data');
    this.authState.next(false);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('jwt_token');
  }
}