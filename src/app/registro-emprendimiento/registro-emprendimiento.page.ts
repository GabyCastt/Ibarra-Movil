import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-registro-emprendimiento',
  templateUrl: './registro-emprendimiento.page.html',
  styleUrls: ['./registro-emprendimiento.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class RegistroEmprendimientoPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
