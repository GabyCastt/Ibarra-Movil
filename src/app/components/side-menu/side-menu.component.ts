import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  IonMenuToggle,
} from '@ionic/angular/standalone';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-side-menu',
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonMenu,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonIcon,
    IonLabel,
    IonMenuToggle,
  ],
})
export class SideMenuComponent {
  menuItems = [
    { title: 'Inicio', icon: 'home', path: '/home' },
    { title: 'Perfil', icon: 'person', path: '/perfil' },
    { title: 'Mis Documentos', icon: 'document-text', path: '/mis-documentos' },
    { title: 'Configuración', icon: 'settings', path: '/settings' },
  ];

  constructor(
    public authService: AuthService,
    private router: Router,
    private alertController: AlertController
  ) {}

  navigateTo(path: string) {
    this.router.navigate([path]);
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
}
