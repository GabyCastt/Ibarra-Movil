import { Component } from '@angular/core';
import { FormBuilder,  FormGroup,  FormsModule,  Validators,  ReactiveFormsModule,} from '@angular/forms';
import { Router } from '@angular/router';
import { ModalController,  LoadingController,  AlertController,  IonicModule,} from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { addIcons } from 'ionicons';
import { mailOutline,   lockClosedOutline,   logoGoogle,   logoFacebook,   arrowBackOutline,   checkmarkCircleOutline,  keyOutline,  eyeOutline,  eyeOffOutline} from 'ionicons/icons';
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
  loginForm!: FormGroup;
  forgotPasswordForm!: FormGroup;
  otpForm!: FormGroup;
  newPasswordForm!: FormGroup;
  
  isModal: boolean = false;
  currentView: 'login' | 'forgot-password' | 'enter-otp' | 'new-password' | 'success' = 'login';
  userEmail: string = '';
  
  recoveryUuid: string = '';
  validatedId: any = '';
  userId: any = 0;
  
  showNewPassword: boolean = false;
  showConfirmPassword: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private modalCtrl: ModalController,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private authService: AuthService
  ) {
    addIcons({ 
      mailOutline, 
      lockClosedOutline, 
      logoGoogle, 
      logoFacebook, 
      arrowBackOutline, 
      checkmarkCircleOutline,
      keyOutline,
      eyeOutline,
      eyeOffOutline
    });

    this.initializeForms();

    const navigation = this.router.getCurrentNavigation();
    this.isModal = navigation?.extras?.state?.['isModal'] || false;
  }

  private initializeForms() {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      remember: [false],
    });

    this.forgotPasswordForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.otpForm = this.formBuilder.group({
      digit1: ['', [Validators.required, Validators.pattern(/^[0-9]$/), Validators.min(0), Validators.max(9)]],
      digit2: ['', [Validators.required, Validators.pattern(/^[0-9]$/), Validators.min(0), Validators.max(9)]],
      digit3: ['', [Validators.required, Validators.pattern(/^[0-9]$/), Validators.min(0), Validators.max(9)]],
      digit4: ['', [Validators.required, Validators.pattern(/^[0-9]$/), Validators.min(0), Validators.max(9)]],
      digit5: ['', [Validators.required, Validators.pattern(/^[0-9]$/), Validators.min(0), Validators.max(9)]],
      digit6: ['', [Validators.required, Validators.pattern(/^[0-9]$/), Validators.min(0), Validators.max(9)]],
    });

    this.newPasswordForm = this.formBuilder.group({
      newPassword: ['', [
        Validators.required, 
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&].+$/)
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { 
      validators: this.passwordMatchValidator 
    });
  }

  private passwordMatchValidator(group: FormGroup) {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  async onSubmit() {
    if (this.loginForm.valid) {
      const loading = await this.showLoading('Iniciando sesión...');

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

  async onForgotPasswordSubmit() {
    if (this.forgotPasswordForm.valid) {
      const loading = await this.showLoading('Validando correo electrónico...');
      this.userEmail = this.forgotPasswordForm.value.email;
      console.log('Validando email:', this.userEmail);

      try {
        const response = await lastValueFrom(
          this.authService.validateEmail(this.userEmail)
        );
        
        console.log('Respuesta de validación email:', response);
        
        this.recoveryUuid = response.uuid;
        console.log('UUID guardado:', this.recoveryUuid);
        
        this.currentView = 'enter-otp';
      } catch (error) {
        console.error('Error en validación de email:', error);
        const errorMessage =
          error && typeof error === 'object' && 'message' in error
            ? (error as any).message
            : 'Error al validar el correo electrónico';
        await this.showError(errorMessage);
      } finally {
        loading.dismiss();
      }
    }
  }

  async onOTPSubmit() {
    if (this.otpForm.valid) {
      const loading = await this.showLoading('Validando código...');
      
      const otpCode = Object.values(this.otpForm.value).join('');
      console.log('Enviando OTP:', otpCode, 'con UUID:', this.recoveryUuid);

      try {
        const response = await lastValueFrom(
          this.authService.validateOTP(otpCode, this.recoveryUuid)
        );
        
        console.log('Respuesta COMPLETA de validación OTP:', JSON.stringify(response, null, 2));
        console.log('Tipo de respuesta:', typeof response);
        console.log('Propiedades de la respuesta:', Object.keys(response || {}));
        
        if (!response) {
          throw new Error('No se recibió respuesta del servidor');
        }
        
        let foundUserId = null;
        const possibleKeys = ['idUsuario', 'validatedId', 'userId', 'id', 'user_id', 'userID', 'ID'];
        
        for (const key of possibleKeys) {
          if (response[key] !== undefined && response[key] !== null) {
            foundUserId = response[key];
            console.log(`ID encontrado en propiedad '${key}':`, foundUserId);
            break;
          }
        }
        
        if (foundUserId !== null) {
          this.validatedId = foundUserId;
          console.log('ValidatedId guardado:', this.validatedId);
          this.currentView = 'new-password';
        } else {

          console.log('No se encontró ID específico, usando respuesta completa');
          console.log('¿Respuesta contiene mensaje de éxito?', response);
          
          this.validatedId = this.recoveryUuid;
          console.log('Usando UUID como fallback:', this.validatedId);
          
          this.currentView = 'new-password';
        }
        
      } catch (error) {
        console.error('Error en validación OTP:', error);
        const errorMessage =
          error && typeof error === 'object' && 'message' in error
            ? (error as any).message
            : 'Código inválido o expirado';
        await this.showError(errorMessage);
        
        this.otpForm.reset();
      } finally {
        loading.dismiss();
      }
    }
  }

  async onNewPasswordSubmit() {
    if (this.newPasswordForm.valid) {
      const loading = await this.showLoading('Actualizando contraseña...');
      
      try {
        if (!this.validatedId || this.validatedId === 'undefined' || this.validatedId === 'null') {
          throw new Error('No se pudo obtener el ID de usuario válido');
        }
        
        this.userId = this.validatedId;
        
        console.log('Intentando cambiar contraseña para userId:', this.userId);
        console.log('Tipo de userId:', typeof this.userId);
        console.log('Nueva contraseña longitud:', this.newPasswordForm.value.newPassword.length);
        
        const userIdNumber = parseInt(this.userId);
        if (isNaN(userIdNumber)) {
          console.error('userId no es un número válido:', this.userId);
          throw new Error('ID de usuario inválido. Intente nuevamente desde el inicio.');
        }
        
        console.log('UserId convertido a número:', userIdNumber);
        
        await lastValueFrom(
          this.authService.resetPassword(userIdNumber, this.newPasswordForm.value.newPassword)
        );
        
        this.currentView = 'success';
      } catch (error) {
        console.error('Error completo:', error);
        const errorMessage =
          error && typeof error === 'object' && 'message' in error
            ? (error as any).message
            : 'Error al actualizar la contraseña. Verifique su conexión e intente nuevamente.';
        await this.showError(errorMessage);
      } finally {
        loading.dismiss();
      }
    }
  }

  onOTPInput(event: any, currentInput: number) {
    const value = event.target.value;
    
    if (!/^[0-9]$/.test(value)) {
      event.target.value = '';
      return;
    }
    
    if (value && currentInput < 6) {
      const nextInput = document.querySelector(`ion-input[data-otp="${currentInput + 1}"]`) as HTMLIonInputElement;
      if (nextInput) {
        nextInput.setFocus();
      }
    }
  }

  onOTPKeydown(event: any, currentInput: number) {
    if (event.key === '-' || event.key === '+' || event.key === 'e' || event.key === 'E') {
      event.preventDefault();
      return;
    }
    
    if (event.key === 'Backspace' && !event.target.value && currentInput > 1) {
      const prevInput = document.querySelector(`ion-input[data-otp="${currentInput - 1}"]`) as HTMLIonInputElement;
      if (prevInput) {
        prevInput.setFocus();
      }
    }
  }

  forgotPassword() {
    this.currentView = 'forgot-password';
    if (this.loginForm.value.email) {
      this.forgotPasswordForm.patchValue({ email: this.loginForm.value.email });
    }
  }

  backToLogin() {
    this.currentView = 'login';
    this.resetRecoveryData();
  }

  backToForgotPassword() {
    this.currentView = 'forgot-password';
    this.otpForm.reset();
  }

  backToOTP() {
    this.currentView = 'enter-otp';
    this.newPasswordForm.reset();
  }

  resendOTP() {
    this.onForgotPasswordSubmit();
  }

  private resetRecoveryData() {
    this.forgotPasswordForm.reset();
    this.otpForm.reset();
    this.newPasswordForm.reset();
    this.userEmail = '';
    this.recoveryUuid = '';
    this.validatedId = '';
    this.userId = 0;
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

  private async showLoading(message: string) {
    const loading = await this.loadingController.create({
      message: message,
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

  togglePasswordVisibility(field: 'new' | 'confirm') {
    if (field === 'new') {
      this.showNewPassword = !this.showNewPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }
}