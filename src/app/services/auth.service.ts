import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://34.10.172.54:8080/auth/login';
  private authState = new BehaviorSubject<boolean>(false);
  
  isAuthenticated$ = this.authState.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.checkAuthState(); // Verifica estado al iniciar
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(this.apiUrl, {
      username: email,
      password: password
    }).pipe(
      tap(response => {
        if (response.status) {
          this.storeAuthData(response);
          this.authState.next(true); // Actualiza estado
          this.router.navigate(['/home']); // Redirige al home
        }
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