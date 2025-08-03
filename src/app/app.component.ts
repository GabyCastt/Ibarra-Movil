import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonApp, 
  IonRouterOutlet,
} from '@ionic/angular/standalone';
import { SideMenuComponent } from './components/side-menu/side-menu.component';
import { AuthService } from './services/auth.service';
import { addIcons } from 'ionicons';
import { home, business, logOut, person, document, personCircleOutline, card, personOutline,
         mailOutline, callOutline, briefcaseOutline, createOutline, personCircle, peopleOutline, 
         locationOutline, ribbon, informationCircleOutline, folderOpen, documentTextOutline, 
         cloudUploadOutline, resizeOutline,
         refresh,
         close,
         personAdd,
         eye, } from 'ionicons/icons';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonApp,
    IonRouterOutlet,
    SideMenuComponent
  ]
})
export class AppComponent {
  constructor(public authService: AuthService) {
    addIcons({ home, business, card, document, logOut,  person, personCircleOutline, personOutline, mailOutline, callOutline, briefcaseOutline, createOutline, personCircle, peopleOutline, locationOutline, ribbon,
      informationCircleOutline, folderOpen, documentTextOutline, cloudUploadOutline, resizeOutline, refresh, close, personAdd, eye

     });
  }
}