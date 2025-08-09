import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class NegocioService {
   private apiUrl = environment.apiUrl;
    private registroUrl = `${this.apiUrl}/business/create`;

  constructor(private http: HttpClient, private authService: AuthService) { }

    private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  post(request: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(this.registroUrl, request, { headers });
  }
}
