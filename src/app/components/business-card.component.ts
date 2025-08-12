import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-business-card',
  templateUrl: './business-card.component.html',
  styleUrls: ['./business-card.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule]
})
export class BusinessCardComponent {
  @Input() business: any;
}