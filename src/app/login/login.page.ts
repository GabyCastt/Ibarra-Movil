import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  mailOutline,
  lockClosedOutline,
  logoGoogle,
  logoFacebook,
  closeOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    ReactiveFormsModule, 
    CommonModule,
    FormsModule
  ]
})
export class LoginPage {
  loginForm: FormGroup;
  isModal: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private modalCtrl: ModalController
  ) {
    addIcons({
      mailOutline,
      lockClosedOutline,
      logoGoogle,
      logoFacebook,
      closeOutline
    });

    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      remember: [false]
    });

    const navigation = this.router.getCurrentNavigation();
    this.isModal = navigation?.extras?.state?.['isModal'] || false;
  }

  onSubmit() {
    if (this.loginForm.valid) {
      console.log('Formulario válido', this.loginForm.value);
      
      if (this.isModal) {
        this.loginSuccess();
      } else {
        this.router.navigate(['/home']);
      }
    }
  }

  forgotPassword() {
    if (this.isModal) {
      this.closeModal(false);
    } else {
      this.router.navigate(['/forgot-password']);
    }
  }

  goToRegister() {
    if (this.isModal) {
      this.closeModal(false);
    } else {
      this.router.navigate(['/register']);
    }
  }

  closeModal(authenticated: boolean) {
    this.modalCtrl.dismiss({
      authenticated,
      userData: this.loginForm.value
    });
  }

  loginSuccess() {
    this.closeModal(true);
  }

  cancelLogin() {
    this.closeModal(false);
  }
}