import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BusquedaService {
  private apiUrl = 'http://34.10.172.54:8080';

  constructor(private http: HttpClient) { }

  buscarNegocios(searchTerm: string, page: number = 0, size: number = 10): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (searchTerm && searchTerm.trim() !== '') {
      params = params.set('searchTerm', searchTerm.trim());
    }

    return this.http.get<any>(`${this.apiUrl}/business/search`, { params });
  }
}