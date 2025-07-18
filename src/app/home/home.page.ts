import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {  locationOutline,
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
      medkitOutline } from 'ionicons/icons';
import { LoginPage } from '../login/login.page';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ]
})
export class HomePage {
  // Datos de ejemplo para categorías
  categories = [
    { id: 1, name: 'Alimentos', icon: 'restaurant-outline', color: '#FF6B6B' },
    { id: 2, name: 'Artesanías', icon: 'brush-outline', color: '#4ECDC4' },
    { id: 3, name: 'Textiles', icon: 'shirt-outline', color: '#45B7D1' },
    { id: 4, name: 'Servicios', icon: 'construct-outline', color: '#FFA07A' },
    { id: 5, name: 'Tecnología', icon: 'hardware-chip-outline', color: '#A28DFF' },
    { id: 6, name: 'Salud', icon: 'medkit-outline', color: '#FF8A65' }
  ];

  // Emprendimientos destacados
  featuredBusinesses = [
    { 
      id: 1, 
      name: 'Artesanías Andinas', 
      image: 'assets/business1.jpg', 
      location: 'Centro', 
      badge: 'Nuevo' 
    },
    { 
      id: 2, 
      name: 'Dulces Tradicionales', 
      image: 'assets/business2.jpg', 
      location: 'San Francisco' 
    },
    { 
      id: 3, 
      name: 'Tejidos El Alpaca', 
      image: 'assets/business3.jpg', 
      location: 'La Victoria',
      badge: 'Popular' 
    }
  ];

  // Próximos eventos
  upcomingEvents = [
    {
      id: 1,
      title: 'Feria de Emprendedores',
      image: 'assets/event1.jpg',
      date: '15 Oct 2023'
    },
    {
      id: 2,
      title: 'Taller de Marketing Digital',
      image: 'assets/event2.jpg',
      date: '22 Oct 2023'
    }
  ];

  constructor(private modalCtrl: ModalController) {
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
      medkitOutline
    })
  }

    async openLogin() {
    const modal = await this.modalCtrl.create({
      component: LoginPage,
      componentProps: {
      },
      cssClass: 'login-modal',
      breakpoints: [0.5, 0.8],
      initialBreakpoint: 0.8,
      backdropDismiss: false,
      canDismiss: true
    });

    await modal.present();

    // Maneja el resultado cuando el modal se cierra
    const { data } = await modal.onWillDismiss();
    if (data?.authenticated) {
      console.log('Login exitoso', data.userData);
    } else {
      console.log('Login cancelado');
    }
  }


  openCategory(category: any) {
    console.log('Categoría seleccionada:', category);
  }

  openBusiness(business: any) {
    console.log('Emprendimiento seleccionado:', business);
  }

  openEvent(event: any) {
    console.log('Evento seleccionado:', event);
  }

  seeAll(type: string) {
    console.log('Ver todos los:', type);
  }

  searchItems(event: any) {
    const term = event.target.value;
    console.log('Buscando:', term);
  }

  navigateTo(page: string) {
    console.log('Navegar a:', page);
  }
}