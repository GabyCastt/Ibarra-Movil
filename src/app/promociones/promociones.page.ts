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
  IonRefresherContent,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, calendar, ticket, time, pricetag } from 'ionicons/icons';
import { PromocionesService, Promocion } from '../services/promociones.service';
import { CrearPromocionPage } from '../crear-promocion/crear-promocion.page';
import { AuthService } from '../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { EditarPromocionPage } from '../editar-promocion/editar-promocion.page';

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
    IonRefresherContent,
  ],
})
export class PromocionesPage implements OnInit {
  promociones: Promocion[] = [];
  isLoading: boolean = true;
  businessId: number = 0;

  constructor(
    private promocionesService: PromocionesService,
    public authService: AuthService,
    private modalCtrl: ModalController,
    private alertController: AlertController,
    private route: ActivatedRoute,
    private router: Router
  ) {
    addIcons({ add, calendar, ticket, time, pricetag });
  }

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      this.businessId = +params.get('id')!;
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
          this.mostrarAlerta(
            'Error',
            response.message || 'Error al cargar promociones'
          );
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar promociones:', error);
        this.isLoading = false;

        if (error.status === 401) {
          this.mostrarAlerta(
            'Sesión expirada',
            'Por favor inicia sesión nuevamente'
          );
          this.authService.logout();
        } else {
          this.mostrarAlerta('Error', 'No se pudieron cargar las promociones');
        }
      },
    });
  }

  async abrirModalCrear() {
    if (!this.authService.isAuthenticated()) {
      this.mostrarAlerta(
        'Error',
        'Debes iniciar sesión para crear promociones'
      );
      return;
    }

    const modal = await this.modalCtrl.create({
      component: CrearPromocionPage,
      componentProps: {
        businessId: this.businessId,
      },
    });

    modal.onDidDismiss().then((result) => {
      if (result.role === 'confirm') {
        this.crearPromocion(result.data.promocion, result.data.archivo);
      }
    });

    await modal.present();
  }

  crearPromocion(promocion: any, archivo: File) {
    if (
      !promocion.businessId ||
      !promocion.tipoPromocion ||
      !promocion.tituloPromocion ||
      !promocion.fechaPromoInicio ||
      !promocion.fechaPromoFin ||
      !promocion.condiciones
    ) {
      this.mostrarAlerta('Error', 'Faltan campos requeridos en la promoción');
      return;
    }

    if (!archivo || archivo.size === 0) {
      this.mostrarAlerta('Error', 'El archivo de imagen no es válido');
      return;
    }

    this.promocionesService.crearPromocion(promocion, archivo).subscribe({
      next: (response) => {
        if (response.success) {
          this.mostrarAlerta('Éxito', 'Promoción creada correctamente');
          this.cargarPromociones();
        } else {
          this.mostrarAlerta(
            'Error',
            response.message || 'Error al crear la promoción'
          );
        }
      },
      error: (error) => {
        console.error('Error completo:', error);

        if (error.status === 401) {
          this.mostrarAlerta(
            'Sesión expirada',
            'Por favor inicia sesión nuevamente'
          );
          this.authService.logout();
        } else if (error.status === 400) {
          this.mostrarAlerta(
            'Error',
            'Datos inválidos: ' +
              (error.error?.message || 'Verifica la información')
          );
        } else if (error.status === 500) {
          if (error.error?.message?.includes('Content-Type')) {
            this.mostrarAlerta(
              'Error',
              'Problema con el formato de la imagen. Intenta con otra imagen o verifica el tipo de archivo.'
            );
          } else {
            this.mostrarAlerta(
              'Error',
              'Error interno del servidor: ' +
                (error.error?.message || 'Intenta más tarde')
            );
          }
        } else {
          this.mostrarAlerta(
            'Error',
            'Error al crear la promoción: ' +
              (error.error?.message || error.message)
          );
        }
      },
    });
  }

  async abrirModalEditar(promocion: Promocion) {
    if (!this.authService.isAuthenticated()) {
      this.mostrarAlerta(
        'Error',
        'Debes iniciar sesión para editar promociones'
      );
      return;
    }

    const modal = await this.modalCtrl.create({
      component: EditarPromocionPage,
      componentProps: {
        promocion: {
          ...promocion,
          businessId: this.businessId,
        },
      },
    });

    modal.onDidDismiss().then((result) => {
      if (result.role === 'confirm') {
        this.editarPromocion(
          promocion.idBusinessPromo!,
          result.data.promocion,
          result.data.archivo
        );
      }
    });

    await modal.present();
  }

  editarPromocion(id: number, promocion: any, archivo: File | null) {
    if (
      !promocion.tipoPromocion ||
      !promocion.tituloPromocion ||
      !promocion.fechaPromoInicio ||
      !promocion.fechaPromoFin ||
      !promocion.condiciones
    ) {
      this.mostrarAlerta('Error', 'Faltan campos requeridos en la promoción');
      return;
    }

    this.promocionesService
      .editarPromocion(id, promocion, archivo || undefined)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.mostrarAlerta('Éxito', 'Promoción actualizada correctamente');
            this.cargarPromociones();
          } else {
            this.mostrarAlerta(
              'Error',
              response.message || 'Error al actualizar la promoción'
            );
          }
        },
        error: (error) => {
          console.error('Error al editar promoción:', error);
          this.mostrarAlerta(
            'Error',
            'Error al actualizar la promoción: ' +
              (error.error?.message || error.message)
          );
        },
      });
  }

  async confirmarEliminacion(promocion: Promocion) {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de que quieres eliminar la promoción "${promocion.tituloPromocion}"?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Eliminar',
          handler: () => {
            this.eliminarPromocion(promocion.idBusinessPromo!);
          },
        },
      ],
    });

    await alert.present();
  }

  eliminarPromocion(id: number) {
    this.promocionesService.eliminarPromocion(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.mostrarAlerta('Éxito', 'Promoción eliminada correctamente');
          this.cargarPromociones();
        } else {
          this.mostrarAlerta(
            'Error',
            response.message || 'Error al eliminar la promoción'
          );
        }
      },
      error: (error) => {
        console.error('Error al eliminar promoción:', error);
        this.mostrarAlerta(
          'Error',
          'Error al eliminar la promoción: ' +
            (error.error?.message || error.message)
        );
      },
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
      buttons: ['OK'],
    });

    await alert.present();
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';

    const datePart = dateString.split('T')[0];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      return dateString;
    }

    const [year, month, day] = datePart.split('-');
    return `${day}/${month}/${year}`;
  }

  private parseDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  isPromocionActive(promocion: Promocion): boolean {
    if (!promocion.fechaPromoInicio || !promocion.fechaPromoFin) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = this.parseDate(promocion.fechaPromoInicio);
    const endDate = this.parseDate(promocion.fechaPromoFin);
    endDate.setHours(23, 59, 59, 999);

    return today >= startDate && today <= endDate;
  }

  getChipColor(tipoPromocion: string): string {
    const colors: { [key: string]: string } = {
      DESCUENTO_PORCENTAJE: 'success',
      DESCUENTO_FIJO: 'primary',
      COMPRA_LLEVAS: 'warning',
      ENVIO_GRATIS: 'tertiary',
    };

    return colors[tipoPromocion] || 'medium';
  }

  getTipoPromocionText(tipoPromocion: string): string {
    const textos: { [key: string]: string } = {
      DESCUENTO_PORCENTAJE: 'Descuento %',
      DESCUENTO_FIJO: 'Descuento Fijo',
      COMPRA_LLEVAS: 'Compra y Llevas',
      ENVIO_GRATIS: 'Envío Gratis',
    };

    return textos[tipoPromocion] || tipoPromocion;
  }

  goBack(): void {
    this.router.navigate(['/detalle-negocio', this.businessId]);
  }
}
