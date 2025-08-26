import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-eliminar-negocio',
  templateUrl: './eliminar-negocio.page.html',
  styleUrls: ['./eliminar-negocio.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class EliminarNegocioPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
