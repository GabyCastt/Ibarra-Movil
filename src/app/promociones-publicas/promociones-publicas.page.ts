import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Promocion, PromocionesService } from '../services/promociones.service';

@Component({
  selector: 'app-promociones-publicas',
  templateUrl: './promociones-publicas.page.html',
  styleUrls: ['./promociones-publicas.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class PromocionesPublicasPage implements OnInit {

  promociones: Promocion[] = [];
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
  this.loadPromotions(value);
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
    private promocionesService: PromocionesService
  ) { }

  ngOnInit() {
    this.loadPromotions();
  }

  private loadPromotions(promotionType?: string) {
  this.promocionesService.getPromotionPublic(promotionType).subscribe({
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
}
