import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Promocion, PromocionesService } from '../services/promociones.service';
import { NegociosService } from '../services/negocios.service';

@Component({
  selector: 'app-promociones-publicas',
  templateUrl: './promociones-publicas.page.html',
  styleUrls: ['./promociones-publicas.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class PromocionesPublicasPage implements OnInit {
  categories: any[] = [];
  promociones: Promocion[] = [];
  selectedCategoryId: number | undefined = undefined;
  promotionTypes = [
    { value: '', label: 'Todas' },
    { value: 'COMBO', label: 'Combo especial' },
    { value: 'DOSXUNO', label: '2x1' },
    { value: 'DESCUENTO_FIJO', label: 'Descuento fijo' },
    { value: 'DESCUENTO_PORCENTAJE', label: 'Descuento %' }
  ];

  selectedPromotionType: string = '';

  onPromotionTypeSelect(value: string) {
    this.selectedPromotionType = value;
    this.loadPromotions(value, this.selectedCategoryId);
  }
  tipoPromocionMap: { [key: string]: string } = {
    'COMBO': 'Combo especial',
    'DOSXUNO': '2x1',
    'DESCUENTO_FIJO': 'Descuento fijo',
    'DESCUENTO_PORCENTAJE': 'Descuento %'
  };

  getTipoPromocionLabel(tipo: string): string {
    return this.tipoPromocionMap[tipo] || "Promoción";
  }


  constructor(
    private promocionesService: PromocionesService,
    private negociosService: NegociosService
  ) { }

  ngOnInit() {
    this.loadPromotions();
    this.loadCategories();
  }

  private loadPromotions(promotionType?: string, categoryId?: number) {
    this.promocionesService.getPromotionPublic(promotionType, categoryId).subscribe({
      next: (response) => {
        if (response.success) {
          this.promociones = response.data;
        } else {
          console.error('Error loading promotions:', response.message);
        }
      },
      error: (error) => {
        console.error('Error loading promotions:', error);
      },
    });
  }

  onCategorySelect(event: any) {
    this.selectedCategoryId = event.detail.value;
    this.loadPromotions(this.selectedPromotionType, this.selectedCategoryId);
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
