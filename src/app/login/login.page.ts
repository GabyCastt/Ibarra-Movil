import { CommonModule } from '@angular/common';
import {
  HttpClient,
  HttpHeaders,
  HttpClientModule,
} from '@angular/common/http';
import { Component, Injectable } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import {
  ModalController,
  LoadingController,
  AlertController,
} from '@ionic/angular';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  mailOutline,
  lockClosedOutline,
  logoGoogle,
  logoFacebook,
  closeOutline,
  logOut,
  logOutOutline,
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
    FormsModule,
    HttpClientModule,
  ],
})
export class LoginPage {
  loginForm: FormGroup;
  isModal: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private modalCtrl: ModalController,
    private http: HttpClient,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) {
    addIcons({
      mailOutline,
      lockClosedOutline,
      logoGoogle,
      logoFacebook,
      closeOutline,
      logOutOutline,
    });

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
        const response = await this.loginToApi();

        if (response.status) {
          // Login exitoso
          await this.handleSuccessfulLogin(response);
        } else {
          await this.showError('Credenciales incorrectas');
        }
      } catch (error) {
        console.error('Error en login:', error);
        await this.showError('Error al conectar con el servidor');
      } finally {
        loading.dismiss();
      }
    }
  }

  private async loginToApi() {
    const loginData = {
      username: this.loginForm.value.email,
      password: this.loginForm.value.password,
    };

    return this.http
      .post<any>('http://34.10.172.54:8080/auth/login', loginData)
      .toPromise();
  }

  private async handleSuccessfulLogin(response: any) {
    // Guarda el token JWT y los datos del usuario
    localStorage.setItem('jwt_token', response.jwt);
    localStorage.setItem('user_data', JSON.stringify(response));

    if (this.isModal) {
      this.closeModal(true, response);
    } else {
      // Verifica si hay una ruta pendiente de autenticación
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
      this.router.navigate(['/register']);
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
