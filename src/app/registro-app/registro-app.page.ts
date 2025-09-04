import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import {
  IonicModule,
  ToastController,
  LoadingController,
  AlertController,
} from '@ionic/angular';
import { Router } from '@angular/router';
import {
  HttpClient,
  HttpClientModule,
  HttpErrorResponse,
} from '@angular/common/http';
import { RegistroAppService } from '../services/registroo.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-registro-app',
  templateUrl: './registro-app.page.html',
  styleUrls: ['./registro-app.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
  ],
})
export class RegistroAppPage implements OnInit {
  registroForm!: FormGroup;
  showPassword = false;
  isLoading = false;
  identityDocumentFile!: File;
  certificateFile!: File;
  signedDocumentFile!: File;

  constructor(
    private fb: FormBuilder,
    private registroService: RegistroAppService,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private router: Router,
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) {
    this.initializeForm();
  }

  ngOnInit() {}

  private initializeForm() {
    this.registroForm = this.fb.group({
      idType: [''],
      email: ['', [Validators.required, Validators.email]],
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
        ],
      ],
      lastname: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
        ],
      ],
      identification: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(15),
        ],
      ],
      phone: ['', [Validators.required, Validators.minLength(1)]],
      address: ['', [Validators.required, Validators.minLength(1)]],
      username: [
        '',
        [
          Validators.required,
          Validators.minLength(5),
          Validators.maxLength(20),
        ],
      ],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(20),
        ],
      ],
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  private async validateForm(): Promise<boolean> {
    // Marcar todos los campos como tocados para mostrar errores
    Object.keys(this.registroForm.controls).forEach((key) => {
      this.registroForm.get(key)?.markAsTouched();
    });

    if (!this.registroForm.valid) {
      await this.showToast(
        'Por favor complete todos los campos requeridos correctamente',
        'warning'
      );

      const errors = [];
      if (this.registroForm.get('email')?.errors) errors.push('Email');
      if (this.registroForm.get('name')?.errors) errors.push('Nombres');
      if (this.registroForm.get('lastname')?.errors) errors.push('Apellidos');
      if (this.registroForm.get('identification')?.errors)
        errors.push('Identificación');
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
    const isValid = await this.validateForm();
    if (!isValid) {
      return;
    }

    const filesValid = await this.validateFiles();
    if (!filesValid) {
      return;
    }

    this.isLoading = true;

    const dataJson = this.registroForm.value;

    const formData = new FormData();
    formData.append('identityDocument', this.identityDocumentFile);
    formData.append('certificate', this.certificateFile);
    formData.append('signedDocument', this.signedDocumentFile);
    formData.append(
      'data',
      new Blob([JSON.stringify(dataJson)], { type: 'application/json' })
    );

    this.registroService.post(formData).subscribe({
      next: async () => {
        this.isLoading = false;
        await this.showSuccessAlert(
          'Registro exitoso',
          '¡Su cuenta ha sido creada correctamente!'
        );
        this.registroForm.reset();
        this.identityDocumentFile = undefined as any;
        this.certificateFile = undefined as any;
        this.signedDocumentFile = undefined as any;
        this.router.navigate(['/login']);
      },
      error: async (err: HttpErrorResponse) => {
        this.isLoading = false;
        let message = 'Error en el servidor';
        if (
          err.status === 413 ||
          err.error?.message?.includes('tamaño máximo')
        ) {
          message = 'El archivo supera el tamaño máximo permitido de 2 MB';
        } else if (err.error?.message) {
          message = err.error.message;
        }
        await this.showToast(message, 'danger');
        console.error('Error en el registro:', err);
      },
    });
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
          },
        },
      ],
    });

    await alert.present();
  }

  limpiarFormulario() {
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
          role: 'cancel',
        },
      ],
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
        return `${this.getFieldLabel(
          fieldName
        )} debe tener al menos ${requiredLength} caracteres`;
      }
      if (field.errors['maxlength']) {
        const requiredLength = field.errors['maxlength'].requiredLength;
        return `${this.getFieldLabel(
          fieldName
        )} no puede tener más de ${requiredLength} caracteres`;
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
      phone: 'Teléfono',
    };

    return labels[fieldName] || fieldName;
  }

  async onFileChange(
    event: Event | DragEvent,
    tipo: 'identityDocument' | 'certificate' | 'signedDocument'
  ) {
    const input =
      event.target instanceof HTMLInputElement ? event.target : null;
    const files = input?.files?.length
      ? input.files
      : (event as DragEvent).dataTransfer?.files;

    if (!files || files.length === 0) {
      return;
    }

    const file = files[0];
    const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (!extension || !allowedExtensions.includes(extension)) {
      await this.showToast(
        'Formato de archivo no permitido. Solo PDF, JPG o PNG',
        'warning'
      );
      if (input) {
        input.value = '';
      }
      this.clearFile(tipo);
      return;
    }

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      await this.showToast(
        'El archivo supera el tamaño máximo de 2 MB',
        'warning'
      );
      if (input) {
        input.value = '';
      }
      this.clearFile(tipo);
      return;
    }

    if (tipo === 'identityDocument') {
      this.identityDocumentFile = file;
    } else if (tipo === 'certificate') {
      this.certificateFile = file;
    } else {
      this.signedDocumentFile = file;
    }

    await this.showToast('Archivo cargado correctamente', 'success');
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onDrop(
    event: DragEvent,
    tipo: 'identityDocument' | 'certificate' | 'signedDocument'
  ) {
    event.preventDefault();
    this.onFileChange(event, tipo);
  }

  hasError(fieldName: string): boolean {
    const field = this.registroForm.get(fieldName);
    return !!(field?.errors && field.touched);
  }

  private async validateFiles(): Promise<boolean> {
    const maxSize = 2 * 1024 * 1024;
    const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png'];

    const files = [
      { file: this.identityDocumentFile, name: 'Documento de Identidad' },
      { file: this.certificateFile, name: 'Patente Municipal' },
      { file: this.signedDocumentFile, name: 'Acuerdo de Comercialización' },
    ];

    for (const item of files) {
      if (!item.file) {
        await this.showToast(`Debe adjuntar ${item.name}`, 'warning');
        return false;
      }

      const extension = item.file.name.split('.').pop()?.toLowerCase();
      if (!extension || !allowedExtensions.includes(extension)) {
        await this.showToast(
          `Formato de archivo no permitido en ${item.name}. Solo PDF, JPG o PNG`,
          'warning'
        );
        return false;
      }

      if (item.file.size > maxSize) {
        await this.showToast(
          `El archivo ${item.name} supera el tamaño máximo de 2 MB`,
          'warning'
        );
        return false;
      }
    }

    return true;
  }

  private clearFile(
    tipo: 'identityDocument' | 'certificate' | 'signedDocument'
  ) {
    if (tipo === 'identityDocument') {
      this.identityDocumentFile = undefined as any;
    } else if (tipo === 'certificate') {
      this.certificateFile = undefined as any;
    } else {
      this.signedDocumentFile = undefined as any;
    }
  }

  async downloadTemplate() {
    try {
      const loading = await this.loadingController.create({
        message: 'Preparando descarga...',
      });
      await loading.present();

      // Ruta al archivo en assets
      const filePath = 'assets/documentos/PlantillaAcuerdo.pdf';

      // Usamos el HttpClient para obtener el archivo como blob
      this.http.get(filePath, { responseType: 'blob' }).subscribe(
        async (blob) => {
          await loading.dismiss();

          // Crear objeto URL
          const url = window.URL.createObjectURL(blob);

          // Crear enlace temporal
          const link = document.createElement('a');
          link.href = url;
          link.download = 'PlantillaAcuerdo.pdf';

          // Disparar el click
          document.body.appendChild(link);
          link.click();

          // Limpiar
          setTimeout(() => {
            window.URL.revokeObjectURL(url);
            document.body.removeChild(link);
          }, 100);

          await this.showToast('Descarga iniciada', 'success');
        },
        async (error) => {
          await loading.dismiss();
          console.error('Error al descargar el archivo:', error);
          await this.showToast('Error al descargar la plantilla', 'danger');
        }
      );
    } catch (error) {
      console.error('Error en el proceso de descarga:', error);
      await this.showToast('Error al preparar la descarga', 'danger');
    }
  }
}
