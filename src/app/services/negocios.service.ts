import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NegociosService {
  private apiUrl = 'http://34.10.172.54:8080';

  constructor(private http: HttpClient) { }

  getCategorias(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/businessCategories/select`);
  }

   getNegocios(categoriaNombre: string, pagina: number, limite: number = 5): Observable<any> {
    let params = new HttpParams()
      .set('page', pagina.toString())
      .set('size', limite.toString());

    // Ahora filtramos por el nombre de la categoría en lugar del ID
    if (categoriaNombre && categoriaNombre.trim() !== '') {
      params = params.set('category', categoriaNombre.trim());
    }

    return this.http.get<any>(`${this.apiUrl}/business/public/approved`, { params });
  }
}