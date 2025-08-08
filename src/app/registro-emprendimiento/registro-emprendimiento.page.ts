import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ToastService } from '../services/toast.service';

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

  constructor(
    private fb: FormBuilder,
    private toastService: ToastService

  ) { this.initializeForm(); }

  ngOnInit() {
    this.registerBusiness.patchValue({
      registrationDate: this.currentDate,
    });
  }

  private initializeForm() {
    this.registerBusiness = this.fb.group({
      commercialName: ['', [Validators.required, Validators.maxLength(50)]],
      representativeName: ['', [Validators.required, Validators.maxLength(50)]],
      identificationNumber: ['', [Validators.required, Validators.pattern('^[0-9]+$'), Validators.maxLength(13)]],
      email: ['', [Validators.email]],
      phone: ['', [Validators.pattern('^[0-9]+$'), Validators.maxLength(10)]],
      website: ['', [Validators.maxLength(50)]],
      description: ['', [Validators.maxLength(200)]],
      parishCommunitySector: ['', [Validators.maxLength(50)]],
      acceptsWhatsappOrders: [false],
      deliveryService: ['', [Validators.pattern('NO|SI|BAJO_PEDIDO')]],
      salePlace: ['', [Validators.pattern('NO|FERIAS|LOCAL_FIJO')]],
      receivedUdelSupport: [false],
      udelSupportDetails: ['', [Validators.maxLength(200)]],
      registrationDate: [''],
      facebook: ['', [Validators.maxLength(50)]],
      instagram: ['', [Validators.maxLength(50)]],
      tiktok: ['', [Validators.maxLength(50)]],
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

  async onSubmit() {
    console.log('Formulario enviado:', this.registerBusiness.value);
    if (this.logoFile) {
      console.log('Archivo logoFile:', this.logoFile);
    }

    if (this.signatureFile) {
      console.log('Archivo signatureFile:', this.signatureFile);
    }

    if (this.cedulaFile) {
      console.log('Archivo cedulaFile:', this.cedulaFile);
    }
  }

    async onFileChange(
    event: Event | DragEvent,
    tipo: 'logoFile' | 'signatureFile' | 'cedulaFile'
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
      await this.toastService.show(
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
      await this.toastService.show(
        'El archivo supera el tamaño máximo de 2 MB',
        'warning'
      );
      if (input) {
        input.value = '';
      }
      this.clearFile(tipo);
      return;
    }

    if (tipo === 'logoFile') {
      this.logoFile = file;
    } else if (tipo === 'signatureFile') {
      this.signatureFile = file;
    } else {
      this.cedulaFile = file;
    }

    await this.toastService.show('Archivo cargado correctamente', 'success');
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onDrop(
    event: DragEvent,
    tipo: 'logoFile' | 'signatureFile' | 'cedulaFile'
  ) {
    event.preventDefault();
    this.onFileChange(event, tipo);
  }

  private clearFile(tipo: 'logoFile' | 'signatureFile' | 'cedulaFile') {
    if (tipo === 'logoFile') {
      this.logoFile = null as any;
    } else if (tipo === 'signatureFile') {
      this.signatureFile = null as any;
    } else {
      this.cedulaFile = null as any;
    }
  }
  

}
