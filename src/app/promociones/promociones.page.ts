// promociones.page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardContent,
  IonCardSubtitle,
  IonImg,
  IonButton,
  IonSpinner,
  IonIcon,
  ModalController,
  AlertController,
  RefresherCustomEvent,
  IonLabel, 
  IonButtons, 
  IonBadge,
  IonChip,
  IonRefresher,
  IonRefresherContent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, calendar, ticket, time, pricetag } from 'ionicons/icons';
import { PromocionesService, Promocion } from '../services/promociones.service';
import { CrearPromocionPage } from '../crear-promocion/crear-promocion.page';
import { AuthService } from '../services/auth.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-promociones',
  templateUrl: './promociones.page.html',
  styleUrls: ['./promociones.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonCardSubtitle,
    IonImg,
    IonButton,
    IonSpinner,
    IonIcon,
    IonLabel, 
    IonButtons, 
    IonBadge,
    IonChip,
    IonRefresher,
    IonRefresherContent
  ]
})
export class PromocionesPage implements OnInit {
  promociones: Promocion[] = [];
  isLoading: boolean = true;
  businessId: number = 0; // Puedes obtener esto del usuario autenticado

  constructor(
    private promocionesService: PromocionesService,
    private authService: AuthService,
    private modalCtrl: ModalController,
    private alertController: AlertController,
    private route: ActivatedRoute
  ) {
    addIcons({ add, calendar, ticket, time, pricetag });
  }

  ngOnInit() {

    // Obtén el ID de los parámetros de la ruta
    this.route.paramMap.subscribe(params => {
      this.businessId = +params.get('id')!;
      console.log('Business ID from route:', this.businessId);
      this.cargarPromociones();
    });
  }

  cargarPromociones() {
    this.isLoading = true;
    this.promocionesService.getPromociones(this.businessId).subscribe({
      next: (response) => {
        if (response.success) {
          this.promociones = response.data;
        } else {
          this.mostrarAlerta('Error', response.message || 'Error al cargar promociones');
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar promociones:', error);
        this.isLoading = false;
        
        if (error.status === 401) {
          this.mostrarAlerta('Sesión expirada', 'Por favor inicia sesión nuevamente');
          this.authService.logout();
        } else {
          this.mostrarAlerta('Error', 'No se pudieron cargar las promociones');
        }
      }
    });
  }

  async abrirModalCrear() {
    // Verificar si el usuario está autenticado
    if (!this.authService.isAuthenticated()) {
      this.mostrarAlerta('Error', 'Debes iniciar sesión para crear promociones');
      return;
    }

    const modal = await this.modalCtrl.create({
      component: CrearPromocionPage,
      componentProps: {
        businessId: this.businessId
      }
    });
    
    modal.onDidDismiss().then((result) => {
      if (result.role === 'confirm') {
        this.crearPromocion(result.data.promocion, result.data.archivo);
      }
    });
    
    await modal.present();
  }

  crearPromocion(promocion: any, archivo: File) {
    this.promocionesService.crearPromocion(promocion, archivo).subscribe({
      next: (response) => {
        if (response.success) {
          this.mostrarAlerta('Éxito', 'Promoción creada correctamente');
          this.cargarPromociones(); // Recargar la lista
        } else {
          this.mostrarAlerta('Error', response.message || 'Error al crear la promoción');
        }
      },
      error: (error) => {
        console.error('Error al crear promoción:', error);
        
        if (error.status === 401) {
          this.mostrarAlerta('Sesión expirada', 'Por favor inicia sesión nuevamente');
          this.authService.logout();
        } else if (error.status === 400) {
          this.mostrarAlerta('Error', 'Datos inválidos. Verifica la información.');
        } else {
          this.mostrarAlerta('Error', 'Error al crear la promoción');
        }
      }
    });
  }

  doRefresh(event: any) {
    this.cargarPromociones();
    setTimeout(() => {
      (event as RefresherCustomEvent).detail.complete();
    }, 1000);
  }

  async mostrarAlerta(titulo: string, mensaje: string) {
    const alert = await this.alertController.create({
      header: titulo,
      message: mensaje,
      buttons: ['OK']
    });
    
    await alert.present();
  }

  // Método para formatear fechas
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // Verificar si una promoción está activa
  isPromocionActive(promocion: Promocion): boolean {
    const today = new Date();
    const startDate = new Date(promocion.fechaPromoInicio);
    const endDate = new Date(promocion.fechaPromoFin);
    
    return today >= startDate && today <= endDate;
  }

  // Método para obtener el color del chip según el tipo de promoción
  getChipColor(tipoPromocion: string): string {
    const colors: { [key: string]: string } = {
      'DESCUENTO_PORCENTAJE': 'success',
      'DESCUENTO_FIJO': 'primary',
      'COMPRA_LLEVAS': 'warning',
      'ENVIO_GRATIS': 'tertiary'
    };
    
    return colors[tipoPromocion] || 'medium';
  }

  // Método para obtener el texto del tipo de promoción
  getTipoPromocionText(tipoPromocion: string): string {
    const textos: { [key: string]: string } = {
      'DESCUENTO_PORCENTAJE': 'Descuento %',
      'DESCUENTO_FIJO': 'Descuento Fijo',
      'COMPRA_LLEVAS': 'Compra y Llevas',
      'ENVIO_GRATIS': 'Envío Gratis'
    };
    
    return textos[tipoPromocion] || tipoPromocion;
  }
}