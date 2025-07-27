import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import {
  ModalController,
  LoadingController,
  AlertController,
  IonicModule,
} from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { addIcons } from 'ionicons';
import {
  mailOutline,
  lockClosedOutline,
  logoGoogle,
  logoFacebook,
} from 'ionicons/icons';
import { CommonModule } from '@angular/common';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule, CommonModule, ReactiveFormsModule],
})
export class LoginPage {
  loginForm: FormGroup;
  isModal: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private modalCtrl: ModalController,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private authService: AuthService
  ) {
    addIcons({ mailOutline, lockClosedOutline, logoGoogle, logoFacebook });

    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      remember: [false],
    });

    const navigation = this.router.getCurrentNavigation();
    this.isModal = navigation?.extras?.state?.['isModal'] || false;
  }

  async onSubmit() {
    if (this.loginForm.valid) {
      const loading = await this.showLoading();

      try {
        const response = await lastValueFrom(
          this.authService.login(
            this.loginForm.value.email,
            this.loginForm.value.password
          )
        );

        await this.handleSuccessfulLogin();
      } catch (error) {
        const errorMessage =
          error && typeof error === 'object' && 'message' in error
            ? (error as any).message
            : 'Error en el login';
        await this.showError(errorMessage);
      } finally {
        loading.dismiss();
      }
    }
  }

  private async handleSuccessfulLogin() {
    if (this.isModal) {
      const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
      this.closeModal(true, userData);
    } else {
      const pendingRoute = localStorage.getItem('pending_route');
      if (pendingRoute) {
        localStorage.removeItem('pending_route');
        this.router.navigate([pendingRoute]);
      } else {
        this.router.navigate(['/home']);
      }
    }
  }

  private async showLoading() {
    const loading = await this.loadingController.create({
      message: 'Iniciando sesión...',
      spinner: 'crescent',
    });
    await loading.present();
    return loading;
  }

  private async showError(message: string) {
    const alert = await this.alertController.create({
      header: 'Error',
      message: message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  closeModal(authenticated: boolean, userData?: any) {
    this.modalCtrl.dismiss({
      authenticated,
      userData,
    });
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
      this.router.navigate(['/registro-app']);
    }
  }

  loginSuccess() {
    this.closeModal(true);
  }

  cancelLogin() {
    this.modalCtrl.dismiss({
      authenticated: false,
    });
  }
}
