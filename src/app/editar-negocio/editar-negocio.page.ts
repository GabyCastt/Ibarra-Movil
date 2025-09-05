import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { Business, DetallePrivadoService } from '../services/detalle-privado.service';
import { NegociosService } from '../services/negocios.service';
import { EditarNegocioService } from '../services/editar-negocio.service';
@Component({
  selector: 'app-editar-negocio',
  templateUrl: './editar-negocio.page.html',
  styleUrls: ['./editar-negocio.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class EditarNegocioPage implements OnInit {
  businessId!: string;
  backUrl!: string;
  business: Business | null = null;
  categories: any[] = [];
  selectedCategoryId: number | undefined = undefined;


  constructor(
    private route: ActivatedRoute,
    private detallePrivadoService: DetallePrivadoService,
    private negociosService: NegociosService,
    private eeditarNegocioService: EditarNegocioService
  ) { }

  ngOnInit() {
    this.businessId = this.route.snapshot.paramMap.get('id')!;
    this.backUrl = `/detalle-negocio/${this.businessId}`;
    this.loadBusinessDetails();
    this.loadCategories();
  }

  loadBusinessDetails(): void {
    this.detallePrivadoService.getBusinessDetails(Number(this.businessId)).subscribe({
      next: (business: Business) => {
        this.business = business;
      },
      error: (error) => {
        console.error('Error fetching business details:', error);
      }
    });
  }

  private async loadCategories() {
    try {
      const categories = await this.negociosService.getCategorias().toPromise();
      this.categories = (categories || []).map((category) => ({
        ...category,
      }));
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

}
