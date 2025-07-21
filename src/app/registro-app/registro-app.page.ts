import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { IonicModule, ToastController, LoadingController, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { RegistroAppService, RegisterUserRequest, CreateAdminRequest } from '../services/registroo.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-registro-app',
  templateUrl: './registro-app.page.html',
  styleUrls: ['./registro-app.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule, FormsModule, HttpClientModule],
  providers: [RegistroAppService]
})
export class RegistroAppPage implements OnInit {
  registroForm!: FormGroup;
  registroTipo: 'usuario' | 'admin' = 'usuario';
  showPassword = false;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private registroService: RegistroAppService,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private router: Router
  ) {
    this.initializeForm();
  }

  ngOnInit() {
    console.log('Componente registro inicializado');
  }

  private initializeForm() {
    this.registroForm = this.fb.group({
      // Todos los campos son requeridos según el curl que funciona
      email: ['', [Validators.required, Validators.email]],
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastname: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      identification: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(15)]],
      phone: ['', [Validators.required, Validators.minLength(1)]],
      address: ['', [Validators.required, Validators.minLength(1)]],
      username: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(20)]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(20)]]
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  private async validateForm(): Promise<boolean> {
    // Marcar todos los campos como tocados para mostrar errores
    Object.keys(this.registroForm.controls).forEach(key => {
      this.registroForm.get(key)?.markAsTouched();
    });

    if (!this.registroForm.valid) {
      await this.showToast('Por favor complete todos los campos requeridos correctamente', 'warning');
      
      // Mostrar errores específicos
      const errors = [];
      if (this.registroForm.get('email')?.errors) errors.push('Email');
      if (this.registroForm.get('name')?.errors) errors.push('Nombres');
      if (this.registroForm.get('lastname')?.errors) errors.push('Apellidos');
      if (this.registroForm.get('identification')?.errors) errors.push('Identificación');
      if (this.registroForm.get('phone')?.errors) errors.push('Teléfono');
      if (this.registroForm.get('address')?.errors) errors.push('Dirección');
      if (this.registroForm.get('username')?.errors) errors.push('Usuario');
      if (this.registroForm.get('password')?.errors) errors.push('Contraseña');
      
      if (errors.length > 0) {
        console.log('Campos con errores:', errors);
      }
      
      return false;
    }

    return true;
  }

  async onSubmit() {
    console.log('Iniciando proceso de registro...');
    
    if (!await this.validateForm()) {
      console.log('Formulario no válido');
      return;
    }

    const loading = await this.loadingController.create({
      message: this.registroTipo === 'admin' ? 'Registrando administrador...' : 'Registrando usuario...',
      spinner: 'crescent'
    });

    try {
      this.isLoading = true;
      await loading.present();

      const formData = this.registroForm.value;
      
      // Preparar datos exactamente como el curl que funciona
      const userData = {
        email: formData.email?.trim() || '',
        name: formData.name?.trim() || '',
        lastname: formData.lastname?.trim() || '',
        identification: formData.identification?.trim() || '',
        phone: formData.phone?.trim() || '',
        address: formData.address?.trim() || '',
        username: formData.username?.trim() || '',
        password: formData.password?.trim() || ''
      };

      // Validar que no hay campos vacíos después del trim
      const emptyFields = Object.entries(userData).filter(([key, value]) => !value || value.length === 0);
      if (emptyFields.length > 0) {
        throw new Error(`Los siguientes campos están vacíos: ${emptyFields.map(([key]) => key).join(', ')}`);
      }

      console.log('Datos a enviar:', userData);
      console.log('Tipo de registro:', this.registroTipo);

      let response;
      
      if (this.registroTipo === 'admin') {
        console.log('Registrando como administrador...');
        // Usar firstValueFrom en lugar de toPromise() que está deprecated
        response = await firstValueFrom(this.registroService.createNewAdmin(userData as CreateAdminRequest));
        await this.showSuccessAlert(
          'Administrador Registrado',
          'El administrador ha sido registrado exitosamente en el sistema.'
        );
      } else {
        console.log('Registrando como usuario normal...');
        // Usar firstValueFrom en lugar de toPromise() que está deprecated
        response = await firstValueFrom(this.registroService.registerUser(userData as RegisterUserRequest));
        await this.showSuccessAlert(
          'Usuario Registrado',
          'El usuario ha sido registrado exitosamente. Nota: Los usuarios nuevos vienen desactivados por defecto y deben ser habilitados por un administrador para poder iniciar sesión.'
        );
      }

      console.log('Registro exitoso:', response);
      this.limpiarFormulario();
      
    } catch (error: any) {
      console.error('Error completo:', error);
      
      let errorMessage = 'Ocurrió un error durante el registro.';
      
      if (error instanceof HttpErrorResponse) {
        console.log('Status:', error.status);
        console.log('Error body:', error.error);
        console.log('Error message:', error.message);
        
        switch (error.status) {
          case 0:
            errorMessage = 'No se puede conectar con el servidor. Verifique su conexión a internet.';
            break;
          case 400:
            errorMessage = 'Datos inválidos. Verifique que todos los campos cumplan con los requisitos.';
            if (error.error && typeof error.error === 'string') {
              errorMessage = error.error;
            } else if (error.error?.message) {
              errorMessage = error.error.message;
            }
            break;
          case 409:
            errorMessage = 'Ya existe un usuario con esa identificación, email o nombre de usuario.';
            break;
          case 422:
            errorMessage = 'Los datos enviados no son válidos. Verifique el formato de los campos.';
            break;
          case 500:
            errorMessage = 'Error interno del servidor. Intente nuevamente más tarde.';
            break;
          default:
            if (error.error?.message) {
              errorMessage = error.error.message;
            } else if (error.message) {
              errorMessage = error.message;
            }
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      await this.showToast(errorMessage, 'danger');
      
    } finally {
      this.isLoading = false;
      await loading.dismiss();
    }
  }

  private async showSuccessAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: [
        {
          text: 'Aceptar',
          handler: () => {
            console.log('Usuario confirmó el registro exitoso');
          }
        }
      ]
    });

    await alert.present();
  }

  limpiarFormulario() {
    this.registroForm.reset();
    this.registroTipo = 'usuario';
    this.showPassword = false;
    console.log('Formulario limpiado');
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 4000,
      position: 'top',
      color,
      buttons: [
        {
          text: 'Cerrar',
          role: 'cancel'
        }
      ]
    });

    await toast.present();
  }

  goHome() {
    this.router.navigate(['/home']);
  }

  getErrorMessage(fieldName: string): string {
    const field = this.registroForm.get(fieldName);
    
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} es requerido`;
      }
      if (field.errors['email']) {
        return 'Ingrese un email válido';
      }
      if (field.errors['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        return `${this.getFieldLabel(fieldName)} debe tener al menos ${requiredLength} caracteres`;
      }
      if (field.errors['maxlength']) {
        const requiredLength = field.errors['maxlength'].requiredLength;
        return `${this.getFieldLabel(fieldName)} no puede tener más de ${requiredLength} caracteres`;
      }
    }
    
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      identification: 'Identificación',
      name: 'Nombres',
      lastname: 'Apellidos',
      address: 'Dirección',
      username: 'Usuario',
      password: 'Contraseña',
      email: 'Correo Electrónico',
      phone: 'Teléfono'
    };
    
    return labels[fieldName] || fieldName;
  }

  hasError(fieldName: string): boolean {
    const field = this.registroForm.get(fieldName);
    return !!(field?.errors && field.touched);
  }
}