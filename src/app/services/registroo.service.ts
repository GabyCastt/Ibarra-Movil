import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class RegistroAppService {
  private apiUrl = 'http://34.10.172.54:8080/users/register';

  constructor(private http: HttpClient) { }

  post(request: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, request)
    .pipe()
  }
 
}