import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { NegociosService } from '../../services/negocios.service';
import { HttpClientModule } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-negocios',
  templateUrl: './negocios.page.html',
  styleUrls: ['negocioss.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, HttpClientModule],
})
export class NegociosPage implements OnInit {
  negocios: any[] = [];
  categorias: any[] = [];
  categoriaSeleccionada: string = '';

  paginaActual = 1;
  totalPaginas = 1;
  limite = 5;
  totalElements: number | null = null;

  constructor(private negociosService: NegociosService,
      private route: ActivatedRoute,
      private router: Router) { }

  ngOnInit() {
    this.cargarCategorias();

    // Leer parámetro enviado desde Home
    this.route.queryParams.subscribe(params => {
      if (params['categoria']) {
        this.categoriaSeleccionada = params['categoria'];
      }

      this.cargarNegocios(1);
    });
  }

  cargarCategorias() {
    this.negociosService.getCategorias().subscribe((data) => {
      this.categorias = data || [];
    });
  }

  cargarNegocios(pagina: number) {
    // página que muestra UI (1-based). Convertir a 0-based para el backend.
    const pageToRequest = Math.max(0, pagina - 1);

    this.negociosService.getNegocios(this.categoriaSeleccionada, pageToRequest, this.limite)
      .subscribe((resp: any) => {
        const data = resp && resp.data ? resp.data : resp; // por si la API cambia el contenedor
        const content = data && data.content ? data.content : [];
        const total = Number(data && data.totalElements ? data.totalElements : 0);

        // calcular total de páginas en el cliente
        const computedTotalPages = total === 0 ? 0 : Math.ceil(total / this.limite);

        // Si el usuario pidió una página mayor a las disponibles, recargar la última página válida
        if (computedTotalPages > 0 && pagina > computedTotalPages) {
          this.cargarNegocios(computedTotalPages);
          return;
        }

        this.negocios = content;
        this.totalElements = total;
        this.totalPaginas = computedTotalPages;

        // ajustar paginaActual: si no hay páginas, poner 0 para indicar "sin resultados"
        if (this.totalPaginas === 0) {
          this.paginaActual = 0;
        } else {
          this.paginaActual = Math.min(Math.max(pagina, 1), this.totalPaginas);
        }
      }, err => {
        console.error('Error cargando negocios', err);
      });
  }
  openBusiness(negocio: any) {
    this.router.navigate(['/detalle-publico', negocio.id]);
  }

  paginaAnterior() {
    if (this.paginaActual > 1) {
      this.cargarNegocios(this.paginaActual - 1);
    }
  }

  paginaSiguiente() {
    if (this.totalPaginas > 0 && this.paginaActual < this.totalPaginas) {
      this.cargarNegocios(this.paginaActual + 1);
    }
  }
}
