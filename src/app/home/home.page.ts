import { Component, OnInit } from '@angular/core';
import { ModalController, LoadingController, AlertController } from '@ionic/angular';
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
} from 'ionicons/icons';
import { LoginPage } from '../login/login.page';
import { Router } from '@angular/router';
import { NegociosService } from '../services/negocios.service';

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

  // Datos estáticos para destacados
  featuredBusinesses: any[] = [
    {
      id: 1,
      name: 'Arte Andino',
      location: 'Centro de Ibarra',
      logoUrl: 'assets/icon/ArteAndino.jpg',
      description: 'Artesanías locales y productos tradicionales'
    },
    {
      id: 2,
      name: 'Café del Río',
      location: 'Malecón de Ibarra',
      logoUrl: 'assets/icon/CafeDelRio.jpg',
      description: 'Café orgánico y gastronomía local'
    },
    {
      id: 3,
      name: 'Moda Imbabura',
      location: 'Calle Flores',
      logoUrl: 'assets/icon/ModaImbabura.jpg',
      description: 'Ropa y accesorios de diseño local'
    }
  ];

  // Datos estáticos para eventos
  upcomingEvents: any[] = [
    {
      id: 1,
      title: 'Feria de Emprendedores',
      date: '2023-12-15',
      location: 'Plaza de Ponchos',
      imageUrl: 'assets/icon/FeriaEmprendedores.jpg',
      description: 'Evento anual para emprendedores locales'
    },
    {
      id: 2,
      title: 'Taller de Marketing Digital',
      date: '2023-12-20',
      location: 'Centro de Convenciones',
      imageUrl: 'assets/icon/TallerMarketing.jpg',
      description: 'Aprende a promocionar tu negocio en línea'
    }
  ];

  private loading: HTMLIonLoadingElement | null = null;

  constructor(
    private modalCtrl: ModalController,
    private alertController: AlertController,
    private router: Router,
    private negociosService: NegociosService,
    private loadingCtrl: LoadingController
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
    });
    this.checkAuthStatus();
  }

  async ngOnInit() {
    await this.loadCategories();
  }

  private checkAuthStatus() {
    const token = localStorage.getItem('jwt_token');
    this.isAuthenticated = !!token;
    if (token) {
      const userData = localStorage.getItem('user_data');
      this.userData = userData ? JSON.parse(userData) : null;
    }
  }

  private async loadCategories() {
    await this.showLoading();
    try {
      const categories = await this.negociosService.getCategorias().toPromise();
      this.categories = categories || [];
    } catch (error) {
      console.error('Error loading categories:', error);
      await this.showErrorAlert();
    } finally {
      await this.hideLoading();
    }
  }

  private async showLoading() {
    this.loading = await this.loadingCtrl.create({
      message: 'Cargando...',
      spinner: 'crescent'
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
      buttons: ['OK']
    });
    await alert.present();
  }

  openCategory(category: any) {
    this.router.navigate(['/negocios'], {
      queryParams: { categoria: category.name },
      state: { categoryName: category.name }
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

  async openLogin() {
    const modal = await this.modalCtrl.create({
      component: LoginPage,
      cssClass: 'login-modal',
      breakpoints: [0.5, 0.8],
      initialBreakpoint: 0.8,
      backdropDismiss: true,
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data?.authenticated) {
      this.isAuthenticated = true;
      this.userData = data.userData;
      await this.showWelcomeAlert();
    }
  }

  private async showWelcomeAlert() {
    const alert = await this.alertController.create({
      header: 'Bienvenido',
      message: `Hola, ${this.userData.nombre || this.userData.username || 'usuario'}!`,
      buttons: ['OK'],
    });
    await alert.present();
  }

  logout() {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_data');
    this.isAuthenticated = false;
    this.userData = null;
  }

  searchItems(event: any) {
    const term = event.target.value;
    if (term.trim() !== '') {
      this.router.navigate(['/busqueda'], {
        queryParams: { q: term }
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
}
