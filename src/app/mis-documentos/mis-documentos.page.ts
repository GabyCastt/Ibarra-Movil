import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
@Component({
  selector: 'app-mis-documentos',
  templateUrl: './mis-documentos.page.html',
  styleUrls: ['./mis-documentos.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
})
export class MisDocumentosPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
