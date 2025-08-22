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
  categoriaNombre: string = '';

  paginaActual = 1;
  totalPaginas = 1;
  limite = 5;
  totalElements: number | null = null;

  constructor(
    private negociosService: NegociosService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarCategorias();

    // Leer parámetros de la URL
    this.route.queryParams.subscribe(params => {
      if (params['categoria']) {
        this.categoriaSeleccionada = params['categoria'];
        
        // Si viene el nombre directamente desde la URL, usarlo
        if (params['categoriaNombre']) {
          this.categoriaNombre = params['categoriaNombre'];
          this.cargarNegocios(1);
        } else {
          // Si no viene el nombre, esperar a que se carguen las categorías
          if (this.categorias.length > 0) {
            this.obtenerNombreCategoria();
          }
        }
      } else {
        this.cargarNegocios(1);
      }
    });
  }

  cargarCategorias() {
    this.negociosService.getCategorias().subscribe((data) => {
      this.categorias = data || [];
      
      // Si ya tenemos una categoría seleccionada desde la URL, obtener su nombre
      if (this.categoriaSeleccionada) {
        this.obtenerNombreCategoria();
      }
    });
  }

  obtenerNombreCategoria() {
    if (this.categorias.length > 0 && this.categoriaSeleccionada) {
      const categoria = this.categorias.find(cat => 
        cat.id.toString() === this.categoriaSeleccionada.toString()
      );
      this.categoriaNombre = categoria ? categoria.name : '';
      
      // Cargar negocios solo cuando ya tenemos el nombre
      this.cargarNegocios(1);
    }
  }

  cargarNegocios(pagina: number) {
    // Convertir a índice 0-based para el backend
    const pageToRequest = Math.max(0, pagina - 1);

    this.negociosService.getNegocios(this.categoriaNombre, pageToRequest, this.limite)
      .subscribe((resp: any) => {
        const data = resp && resp.data ? resp.data : resp;
        const content = data && data.content ? data.content : [];
        const total = Number(data && data.totalElements ? data.totalElements : 0);

        const computedTotalPages = total === 0 ? 0 : Math.ceil(total / this.limite);

        if (computedTotalPages > 0 && pagina > computedTotalPages) {
          this.cargarNegocios(computedTotalPages);
          return;
        }

        this.negocios = content;
        this.totalElements = total;
        this.totalPaginas = computedTotalPages;
        this.paginaActual = this.totalPaginas === 0 ? 0 : Math.min(Math.max(pagina, 1), this.totalPaginas);
      }, err => {
        console.error('Error cargando negocios', err);
      });
  }

  // Manejar cambio de categoría en el select
  onCategoriaChange() {
    if (this.categoriaSeleccionada) {
      const categoria = this.categorias.find(cat => 
        cat.id.toString() === this.categoriaSeleccionada.toString()
      );
      this.categoriaNombre = categoria ? categoria.name : '';
    } else {
      this.categoriaNombre = '';
    }
    this.cargarNegocios(1);
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

  // Método para limpiar filtros
  limpiarFiltros() {
    this.categoriaSeleccionada = '';
    this.categoriaNombre = '';
    this.cargarNegocios(1);
  }
}