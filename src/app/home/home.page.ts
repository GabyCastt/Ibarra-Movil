import { Component, OnInit } from '@angular/core';
import {
  ModalController,
  LoadingController,
  AlertController,
} from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  locationOutline,
  personCircleOutline,
  chevronForwardOutline,
  mapOutline,
  businessOutline,
  calendarOutline,
  restaurantOutline,
  brushOutline,
  shirtOutline,
  constructOutline,
  hardwareChipOutline,
  medkitOutline,
  logOutOutline,
  fastFoodOutline,
  colorPaletteOutline,
  homeOutline,
  buildOutline,
  ellipsisHorizontalOutline,
  helpOutline,
} from 'ionicons/icons';
import { LoginPage } from '../login/login.page';
import { Router } from '@angular/router';
import { NegociosService } from '../services/negocios.service';
import { AuthService } from '../services/auth.service';
import { Promocion, PromocionesService } from '../services/promociones.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class HomePage implements OnInit {
  isAuthenticated = false;
  userData: any = null;
  categories: any[] = [];
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

  // Datos estáticos para eventos
  upcomingEvents: any[] = [
    {
      id: 1,
      title: 'Feria de Emprendedores',
      date: '2023-12-15',
      location: 'Plaza de Ponchos',
      imageUrl: 'assets/icon/FeriaEmprendedores.jpg',
      description: 'Evento anual para emprendedores locales',
    },
    {
      id: 2,
      title: 'Taller de Marketing Digital',
      date: '2023-12-20',
      location: 'Centro de Convenciones',
      imageUrl: 'assets/icon/TallerMarketing.jpg',
      description: 'Aprende a promocionar tu negocio en línea',
    },
  ];

  private loading: HTMLIonLoadingElement | null = null;

  constructor(
    private modalCtrl: ModalController,
    private alertController: AlertController,
    private promocionesService: PromocionesService,
    private router: Router,
    private negociosService: NegociosService,
    private loadingCtrl: LoadingController,
    private authService: AuthService
  ) {
    addIcons({
      locationOutline,
      personCircleOutline,
      chevronForwardOutline,
      mapOutline,
      businessOutline,
      calendarOutline,
      restaurantOutline,
      brushOutline,
      shirtOutline,
      constructOutline,
      hardwareChipOutline,
      medkitOutline,
      logOutOutline,
      fastFoodOutline,
      colorPaletteOutline,
      homeOutline,
      buildOutline,
      ellipsisHorizontalOutline,
      helpOutline,
    });
  }

  async ngOnInit() {
    this.checkAuthStatus();
    await this.loadCategories();
    this.setupAuthSubscription();
    this.loadPromotions();
  }

  private setupAuthSubscription() {
    this.authService.isAuthenticated$.subscribe((isAuthenticated) => {
      this.isAuthenticated = isAuthenticated;
      if (isAuthenticated) {
        this.userData = this.authService.getCurrentUser();
      } else {
        this.userData = null;
      }
    });
  }

  private checkAuthStatus() {
    this.isAuthenticated = this.authService.isAuthenticated();
    if (this.isAuthenticated) {
      this.userData = this.authService.getCurrentUser();
    }
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

onPromotionTypeChange() {
  this.loadPromotions(this.selectedPromotionType);
}

  private async loadCategories() {
    await this.showLoading();
    try {
      const categories = await this.negociosService.getCategorias().toPromise();
      this.categories = (categories || []).map((category) => ({
        ...category,
        icon: this.getCategoryIcon(category.name),
        color: this.getCategoryColor(category.id),
      }));
    } catch (error) {
      console.error('Error loading categories:', error);
      await this.showErrorAlert();
    } finally {
      await this.hideLoading();
    }
  }

  private getCategoryIcon(categoryName: string): string {
    const iconMap: { [key: string]: string } = {
      'Alimentos y Bebidas': 'fast-food-outline',
      Gastronomía: 'restaurant-outline',
      Artesanías: 'color-palette-outline',
      'Manualidades y Bisutería': 'construct-outline',
      'Salud y Cosmética Natural': 'medkit-outline',
      'Textiles y Moda': 'shirt-outline',
      Tecnología: 'hardware-chip-outline',
      'Decoración, Hogar y Jardinería': 'home-outline',
      Servicios: 'build-outline',
      Otro: 'ellipsis-horizontal-outline',
    };
    return iconMap[categoryName] || 'help-outline';
  }

  private getCategoryColor(categoryId: number): string {
    const colorMap: { [key: number]: string } = {
      1: '#E53935', // Rojo para alimentos
      2: '#FB8C00', // Naranja para gastronomía
      3: '#8E24AA', // Púrpura para artesanías
      4: '#3949AB', // Azul índigo para manualidades
      5: '#43A047', // Verde para salud
      6: '#FDD835', // Amarillo para textiles/moda
      7: '#00ACC1', // Turquesa para tecnología
      8: '#5E35B1', // Violeta para decoración
      9: '#6D4C41', // Marrón para servicios
      10: '#757575', // Gris para otros
    };
    return colorMap[categoryId] || '#607D8B';
  }

  private async showLoading() {
    this.loading = await this.loadingCtrl.create({
      message: 'Cargando...',
      spinner: 'crescent',
    });
    await this.loading.present();
  }

  private async hideLoading() {
    if (this.loading) {
      await this.loading.dismiss();
      this.loading = null;
    }
  }

  private async showErrorAlert() {
    const alert = await this.alertController.create({
      header: 'Error',
      message: 'No se pudieron cargar las categorías.',
      buttons: ['OK'],
    });
    await alert.present();
  }

  openCategory(category: any) {
    this.router.navigate(['/negocios'], {
      queryParams: {
        categoria: category.id,
        categoriaNombre: category.name // Pasamos ambos para mayor seguridad
      }
    });
  }

  openBusiness(business: any) {
    this.router.navigate(['/negocio-detalle', business.id]);
  }

  seeAll(type: string) {
    if (type === 'featured') {
      this.router.navigate(['/negocios']);
    } else if (type === 'events') {
      this.router.navigate(['/eventos']);
    }
  }

  openBusinessById(businessId: number) {
    this.router.navigate(['/detalle-publico', businessId]);
  }

  async showWelcomeAlert() {
    const userName =
      this.userData?.name || this.userData?.username || 'usuario';

    const alert = await this.alertController.create({
      header: '¡Bienvenido/a!',
      message: `Hola ${userName}, te has conectado exitosamente.`,
      buttons: ['OK'],
      cssClass: 'welcome-alert',
    });

    await alert.present();
  }

  async logout() {
    const alert = await this.alertController.create({
      header: 'Cerrar Sesión',
      message: '¿Estás seguro de que quieres cerrar sesión?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: 'Sí, Cerrar Sesión',
          handler: () => {
            this.confirmLogout();
          },
        },
      ],
    });

    await alert.present();
  }

  private async confirmLogout() {
    this.authService.logout();
    await this.showLogoutAlert();
    this.router.navigate(['/home']);
  }

  private async showLogoutAlert() {
    const alert = await this.alertController.create({
      header: 'Sesión cerrada',
      message: 'Has cerrado sesión exitosamente.',
      buttons: ['OK'],
      cssClass: 'logout-alert',
    });

    await alert.present();
  }

  searchItems(event: any) {
    const term = event.target.value;
    if (term.trim() !== '') {
      this.router.navigate(['/busqueda'], {
        queryParams: { q: term },
      });
    }
  }

  navigateTo(page: string) {
    if (page === 'registro-emprendimiento' && !this.isAuthenticated) {
      this.showLoginForRegister();
    } else {
      this.router.navigate([`/${page}`]);
    }
  }

  private async showLoginForRegister() {
    const alert = await this.alertController.create({
      header: 'Acceso requerido',
      message: 'Debes iniciar sesión para registrar un emprendimiento',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Iniciar sesión',
          handler: () => {
            localStorage.setItem('pending_route', '/registro-emprendimiento');
            this.openLogin();
          },
        },
      ],
    });
    await alert.present();
  }
  async openLogin() {
    const modal = await this.modalCtrl.create({
      component: LoginPage,
      cssClass: 'login-modal',
      breakpoints: [0.5, 0.8],
      initialBreakpoint: 0.8,
      backdropDismiss: true,
      componentProps: {
        isModal: true,
      },
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();

    if (data?.authenticated) {
      this.isAuthenticated = true;
      this.userData = data.userData;
      await this.showWelcomeAlert();
    } else if (data?.navigateToRegister) {
      // Navegar al registro cuando el usuario cierra el modal para registrarse
      this.router.navigate(['/registro-app']);
    }
  }
}
