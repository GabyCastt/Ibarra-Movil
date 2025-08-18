import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ToastService } from '../services/toast.service';
import { NegocioService } from '../services/negocio.service';
import { lastValueFrom } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registro-emprendimiento',
  templateUrl: './registro-emprendimiento.page.html',
  styleUrls: ['./registro-emprendimiento.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, ReactiveFormsModule],
})
export class RegistroEmprendimientoPage implements OnInit {
  registerBusiness!: FormGroup;
  currentDate: string = new Date().toISOString().split('T')[0];
  logoFile!: File;
  signatureFile!: File;
  cedulaFile!: File;
  carrouselPhotos: File[] = [];
  categories: any[] = []; // Nueva propiedad para almacenar categorías

  constructor(
    private fb: FormBuilder,
    private toastService: ToastService,
    private negocioService: NegocioService,
    private router: Router
  ) {
    this.initializeForm();
  }

  async ngOnInit() {
    await this.loadCategories(); // Cargar categorías al iniciar
    this.registerBusiness.patchValue({
      registrationDate: this.currentDate,
    });
  }

  async loadCategories() {
    try {
      this.categories = await this.negocioService.getCategories().toPromise();
      // Estable la primera categoría como selección por defecto
      if (this.categories.length > 0) {
        this.registerBusiness.patchValue({
          categoryId: this.categories[0].id,
        });
      }
    } catch (error) {
      console.error('Error cargando categorías:', error);
      await this.toastService.show('Error al cargar categorías', 'danger');
    }
  }

  private initializeForm() {
    this.registerBusiness = this.fb.group({
      categoryId: [null, [Validators.required]],
      commercialName: ['', [Validators.required, Validators.maxLength(50)]],
      representativeName: ['', [Validators.required, Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.maxLength(15)]],
      website: ['', [Validators.maxLength(50)]],
      description: ['', [Validators.required, Validators.maxLength(200)]],
      parishCommunitySector: ['', Validators.required, [Validators.maxLength(50)]],
      acceptsWhatsappOrders: [false],
      whatsappNumber: ['', [Validators.required, Validators.maxLength(15)]],
      googleMapsCoordinates: ['', [Validators.required, Validators.maxLength(100)]],
      deliveryService: ['NO', [Validators.pattern('NO|SI|BAJO_PEDIDO')]],
      salePlace: ['NO', [Validators.pattern('NO|FERIAS|LOCAL_FIJO')]],
      receivedUdelSupport: [false],
      udelSupportDetails: ['', [Validators.maxLength(200)]],
      registrationDate: [''],
      facebook: ['', [Validators.maxLength(50)]],
      instagram: ['', [Validators.maxLength(50)]],
      tiktok: ['', [Validators.maxLength(50)]],
      address: ['', [Validators.required, Validators.maxLength(100)]],
      schedules: this.fb.array(
  [this.fb.control('', Validators.required)],
  Validators.required
),


      productsServices: ['', [Validators.required, Validators.maxLength(50)]],
    });
  }

  hasError(controlName: string): boolean {
    const control = this.registerBusiness.get(controlName);
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  getErrorMessage(controlName: string): string {
    const control = this.registerBusiness.get(controlName);
    if (!control || !control.errors) return '';

    const messages: Record<string, string> = {
      required: 'Este campo es obligatorio',
      maxlength: `Máximo ${control.errors['maxlength']?.requiredLength} caracteres`,
      email: 'Formato de correo inválido',
      pattern: 'Formato inválido',
    };

    for (const error in control.errors) {
      if (messages[error]) return messages[error];
    }
    return '';
  }

  addSchedule(): void {
    this.schedules.push(this.fb.control('', Validators.required));
  }


  removeSchedule(index: number) {
    this.schedules.removeAt(index);
  }


  get schedules(): FormArray {
    return this.registerBusiness.get('schedules') as FormArray;
  }


  isLoading = false;

  async onSubmit() {
    if (this.registerBusiness.invalid || !this.validateFiles()) {
      await this.toastService.show(
        'Por favor complete todos los campos requeridos',
        'warning'
      );
      return;
    }

    const formData = new FormData();
    formData.append('cedulaFile', this.cedulaFile);
    formData.append('logoFile', this.logoFile);
    formData.append('signatureFile', this.signatureFile);

    this.carrouselPhotos.forEach((file) => {
      formData.append('carrouselPhotos', file);
    });

    formData.append(
      'business',
      new Blob(
        [
          JSON.stringify({
            ...this.registerBusiness.value,
            productsServices: this.registerBusiness.value.productsServices,
          }),
        ],
        { type: 'application/json' }
      )
    );

    this.isLoading = true;
    try {
      await lastValueFrom(this.negocioService.createBusiness(formData));

      await this.toastService.show('Registro exitoso', 'success');
      this.registerBusiness.reset();
      this.logoFile = null as any;
      this.signatureFile = null as any;
      this.cedulaFile = null as any;
      this.carrouselPhotos = [];

      if (this.categories.length > 0) {
        this.registerBusiness.patchValue({
          categoryId: this.categories[0].id,
        });
      }

      this.router.navigate(['/mis-negocios']);
    } catch (error: any) {
      console.error('Error al registrar el negocio:', error);
      await this.toastService.show(
        error.message || 'Error al registrar el negocio',
        'danger'
      );
    } finally {
      this.isLoading = false;
    }
  }

  validateFiles(): boolean {
    if (!this.cedulaFile) {
      this.toastService.show('La cédula es obligatoria', 'warning');
      return false;
    }
    return true;
  }

  async onFileChange(
    event: Event | DragEvent,
    tipo: 'logoFile' | 'signatureFile' | 'cedulaFile' | 'carrouselPhotos'
  ) {
    const input =
      event.target instanceof HTMLInputElement ? event.target : null;
    const files = input?.files?.length
      ? input.files
      : (event as DragEvent).dataTransfer?.files;

    if (!files || files.length === 0) {
      return;
    }

    const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
    const maxSize = 2 * 1024 * 1024;

    const validFiles: File[] = [];
    for (const file of Array.from(files)) {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!extension || !allowedExtensions.includes(extension)) {
        await this.toastService.show(
          'Formato no permitido. Solo PDF, JPG o PNG',
          'warning'
        );
        continue;
      }
      if (file.size > maxSize) {
        await this.toastService.show(
          `El archivo ${file.name} supera los 2 MB`,
          'warning'
        );
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      if (input) input.value = '';
      this.clearFile(tipo);
      return;
    }

    if (tipo === 'logoFile') {
      this.logoFile = validFiles[0];
    } else if (tipo === 'signatureFile') {
      this.signatureFile = validFiles[0];
    } else if (tipo === 'cedulaFile') {
      this.cedulaFile = validFiles[0];
    } else if (tipo === 'carrouselPhotos') {
      this.carrouselPhotos = validFiles;
    } else if (tipo === 'carrouselPhotos') {
      this.carrouselPhotos = validFiles;
    }

    await this.toastService.show(
      'Archivo(s) cargado(s) correctamente',
      'success'
    );
  }

  onDrop(
    event: DragEvent,
    tipo: 'logoFile' | 'signatureFile' | 'cedulaFile' | 'carrouselPhotos'
  ) {
    event.preventDefault();
    this.onFileChange(event, tipo);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  private clearFile(
    tipo: 'logoFile' | 'signatureFile' | 'cedulaFile' | 'carrouselPhotos'
  ) {
    if (tipo === 'logoFile') {
      this.logoFile = null as any;
    } else if (tipo === 'signatureFile') {
      this.signatureFile = null as any;
    } else {
      this.cedulaFile = null as any;
    }
  }
}
