import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NegociosService {
  // URL temporal de prueba
  private apiUrl = 'http://34.10.172.54:8080';

  constructor(private http: HttpClient) { }

  getCategorias(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/businessCategories/select`);
  }

  getNegocios(categoria: string, pagina: number, limite: number = 5): Observable<any> {
    let params = new HttpParams()
      .set('page', pagina.toString())
      .set('size', limite.toString());

    if (categoria) {
      params = params.set('category', categoria);
    }

    return this.http.get<any>(`${this.apiUrl}/business/public-list-by-category`, { params });
  }
}
