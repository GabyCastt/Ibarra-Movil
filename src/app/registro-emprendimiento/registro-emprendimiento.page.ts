import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
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

declare var L: any;

@Component({
  selector: 'app-registro-emprendimiento',
  templateUrl: './registro-emprendimiento.page.html',
  styleUrls: ['./registro-emprendimiento.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, ReactiveFormsModule],
})
export class RegistroEmprendimientoPage implements OnInit, AfterViewInit {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

  registerBusiness!: FormGroup;
  currentDate!: string;

  logoFile!: File;
  carrouselPhotos: File[] = [];
  categories: any[] = [];
  parishes: any[] = [];
  isLoading = false;
  selectedType: string | null = null;
  selectedParishType: string = '';

  parishTypes = [
    { label: 'Rural', value: 'RURAL' },
    { label: 'Urbana', value: 'URBANA' }
  ];

  onParishTypeSelect(type: string) {
    this.selectedParishType = type;
    this.loadParish(type);
  }

  // Variables para el mapa
  map: any;
  marker: any;
  showMap = false;

  constructor(
    private fb: FormBuilder,
    private toastService: ToastService,
    private negocioService: NegocioService,
    private router: Router
  ) {
    this.initializeForm();
  }

  async ngOnInit() {
    await this.loadCategories();
    this.loadParish("RURAL");
    this.currentDate = this.getDateInEcuador();
    this.registerBusiness.patchValue({
      registrationDate: this.currentDate,
    });

    // Cargar Leaflet dinámicamente
    await this.loadLeafletScript();
  
  }

  ngAfterViewInit() {
    // El mapa se inicializará cuando el usuario haga clic en "Abrir Mapa"
  }



  private async loadLeafletScript() {
    if (typeof L !== 'undefined') {
      return;
    }

    return new Promise<void>((resolve) => {
      // CSS de Leaflet
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(cssLink);

      // Script de Leaflet
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => resolve();
      document.head.appendChild(script);
    });
  }

  private async loadCategories() {
    try {
      this.categories = await lastValueFrom(this.negocioService.getCategories());
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

private loadParish(type?: string) {
  this.negocioService.getListParish(type).subscribe({
    next: (response) => {
      this.parishes = response;

      if (this.parishes.length > 0) {
        this.registerBusiness.patchValue({
          parishId: this.parishes[0].id,
        });
      }
    },
    error: (error) => {
      console.error('Error loading parishes:', error);
    },
  });
}


  private initializeForm() {
    this.registerBusiness = this.fb.group({
      categoryId: [null, [Validators.required]],
      commercialName: ['', [Validators.required, Validators.maxLength(100)]],
      countryCodePhone: ['+593', Validators.required],
      countryCode: ['+593', Validators.required],
      phone: ['', [Validators.required, Validators.maxLength(9), Validators.pattern('^[0-9]+$')]],
      website: ['', [Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.maxLength(200)]],
      parishCommunitySector: ['Paris', [Validators.required, Validators.maxLength(50)]],
      acceptsWhatsappOrders: [false],
      whatsappNumber: [''],
      googleMapsCoordinates: ['', [Validators.required, Validators.maxLength(100)]],
      deliveryService: ['NO', [Validators.pattern('NO|SI|BAJO_PEDIDO')]],
      salePlace: ['NO', [Validators.pattern('NO|FERIAS|LOCAL_FIJO')]],
      receivedUdelSupport: [false],
      udelSupportDetails: ['', [Validators.maxLength(200)]],
      registrationDate: [''],
      parishId: [null, [Validators.required]],
      facebook: ['', [Validators.maxLength(100)]],
      instagram: ['', [Validators.maxLength(100)]],
      tiktok: ['', [Validators.maxLength(100)]],
      address: ['', [Validators.required, Validators.maxLength(100)]],
      schedules: ['', [Validators.required, Validators.maxLength(100)]],
      productsServices: ['', [Validators.required, Validators.maxLength(50)]],
    });

    // Validación condicional para WhatsApp
    this.registerBusiness.get('acceptsWhatsappOrders')?.valueChanges.subscribe(accepts => {
      const whatsappControl = this.registerBusiness.get('whatsappNumber');
      if (accepts) {
        whatsappControl?.setValidators([
          Validators.required,
          Validators.maxLength(9),
          Validators.pattern('^[0-9]+$')
        ]);
      } else {
        whatsappControl?.clearValidators();
      }
      whatsappControl?.updateValueAndValidity();
    });
  }

  // =================== MÉTODOS DEL MAPA ===================
  openMap() {
    this.showMap = true;
    setTimeout(() => {
      this.initMap();
    }, 100);
  }

  closeMap() {
    this.showMap = false;
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  private initMap() {
    if (!this.mapContainer || this.map) return;

    // Coordenadas por defecto (Ibarra, Ecuador)
    const defaultLat = 0.3516;
    const defaultLng = -78.1225;

    this.map = L.map(this.mapContainer.nativeElement).setView([defaultLat, defaultLng], 13);

    // Agregar capa de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Agregar marcador inicial
    this.marker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(this.map);

    // Evento cuando se hace clic en el mapa
    this.map.on('click', (e: any) => {
      this.updateMarkerPosition(e.latlng);
    });

    // Evento cuando se arrastra el marcador
    this.marker.on('dragend', (e: any) => {
      this.updateMarkerPosition(e.target.getLatLng());
    });

    // Intentar obtener ubicación actual
    this.getCurrentLocation();
  }

  private updateMarkerPosition(latlng: any) {
    if (this.marker) {
      this.marker.setLatLng(latlng);
    }

    const coordinates = `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`;
    this.registerBusiness.patchValue({
      googleMapsCoordinates: coordinates
    });
  }

  private getCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          this.map.setView([lat, lng], 15);
          this.updateMarkerPosition({ lat, lng });
        },
        (error) => {
          console.log('Error obteniendo ubicación:', error);
        }
      );
    }
  }

  centerOnCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          this.map.setView([lat, lng], 15);
          this.updateMarkerPosition({ lat, lng });
          this.toastService.show('Ubicación actualizada', 'success');
        },
        (error) => {
          this.toastService.show('No se pudo obtener la ubicación actual', 'warning');
        }
      );
    } else {
      this.toastService.show('Geolocalización no disponible', 'warning');
    }
  }

  confirmLocation() {
    const coordinates = this.registerBusiness.get('googleMapsCoordinates')?.value;
    if (coordinates) {
      this.closeMap();
      this.toastService.show('Ubicación seleccionada correctamente', 'success');
    } else {
      this.toastService.show('Por favor selecciona una ubicación en el mapa', 'warning');
    }
  }

  // =================== VALIDACIONES ===================
  hasError(controlName: string): boolean {
    const control = this.registerBusiness.get(controlName);
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  getErrorMessage(controlName: string): string {
    const control = this.registerBusiness.get(controlName);
    if (!control || !control.errors) return '';

    // Mensajes específicos por campo
    const fieldMessages: Record<string, Record<string, string>> = {
      'commercialName': {
        'required': 'El nombre comercial es obligatorio',
        'maxlength': 'El nombre no puede exceder 100 caracteres'
      },
      'phone': {
        'required': 'El teléfono es obligatorio',
        'pattern': 'Ingrese solo números',
        'maxlength': 'Máximo 9 dígitos'
      },
      'whatsappNumber': {
        'required': 'WhatsApp es obligatorio cuando está habilitado',
        'pattern': 'Ingrese solo números',
        'maxlength': 'Máximo 9 dígitos'
      },
      'googleMapsCoordinates': {
        'required': 'Debe seleccionar una ubicación en el mapa'
      },
      'description': {
        'required': 'La descripción es obligatoria',
        'maxlength': 'Máximo 200 caracteres'
      },
      'address': {
        'required': 'La dirección es obligatoria',
        'maxlength': 'Máximo 100 caracteres'
      },
      'productsServices': {
        'required': 'Debe especificar qué productos o servicios ofrece',
        'maxlength': 'Máximo 50 caracteres'
      },
      'parishCommunitySector': {
        'required': 'El sector comunitario es obligatorio',
        'maxlength': 'Máximo 50 caracteres'
      },
      'schedules': {
        'required': 'El horario es obligatorio',
        'maxlength': 'Máximo 100 caracteres'
      },
    };

    // Buscar mensaje específico
    if (fieldMessages[controlName]) {
      for (const error in control.errors) {
        if (fieldMessages[controlName][error]) {
          return fieldMessages[controlName][error];
        }
      }
    }

    // Mensajes genéricos
    const genericMessages: Record<string, string> = {
      required: 'Este campo es obligatorio',
      maxlength: `Máximo ${control.errors['maxlength']?.requiredLength} caracteres`,
      email: 'Formato de correo inválido',
      pattern: 'Formato inválido',
      min: `Valor mínimo: ${control.errors['min']?.min}`,
      max: `Valor máximo: ${control.errors['max']?.max}`
    };

    for (const error in control.errors) {
      if (genericMessages[error]) return genericMessages[error];
    }

    return 'Campo inválido';
  }

  // =================== VALIDACIONES ADICIONALES ===================
  private validateCoordinates(coordinates: string): boolean {
    if (!coordinates) return false;

    // Formato esperado: "lat, lng" o "lat,lng"
    const coordRegex = /^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*$/;
    if (!coordRegex.test(coordinates)) return false;

    const [lat, lng] = coordinates.split(',').map(coord => parseFloat(coord.trim()));

    // Validar rangos válidos de latitud y longitud
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }


  private validateEcuadorianPhone(phone: string): boolean {
    // Números ecuatorianos: celulares empiezan con 9, fijos con 2-7
    if (phone.length !== 9) return false;

    const firstDigit = phone.charAt(0);
    return ['2', '3', '4', '5', '6', '7', '9'].includes(firstDigit);
  }

  private validateFormBeforeSubmit(): boolean {
    // Validar coordenadas
    const coordinates = this.registerBusiness.get('googleMapsCoordinates')?.value;
    if (!this.validateCoordinates(coordinates)) {
      this.toastService.show(
        'Las coordenadas del mapa no son válidas',
        'warning'
      );
      return false;
    }

    const countryCode = this.registerBusiness.get('countryCodePhone')?.value;
    const phone = this.registerBusiness.get('phone')?.value;
    if (countryCode === '+593' && phone) {
      if (!this.validateEcuadorianPhone(phone)) {
        this.toastService.show(
          'Número de teléfono ecuatoriano inválido',
          'warning'
        );
        return false;
      }
    }

    return true;
  }

  async onFileChange(event: Event | DragEvent, tipo: 'logoFile' | 'carrouselPhotos') {
    const input = event.target instanceof HTMLInputElement ? event.target : null;
    const files = input?.files?.length ? input.files : (event as DragEvent).dataTransfer?.files;

    if (!files || files.length === 0) {
      return;
    }

    const allowedExtensions = ['jpg', 'jpeg', 'png'];
    const maxSize = 2 * 1024 * 1024; // 2MB
    const validFiles: File[] = [];

    for (const file of Array.from(files)) {
      const extension = file.name.split('.').pop()?.toLowerCase();

      if (!extension || !allowedExtensions.includes(extension)) {
        await this.toastService.show(
          `Formato no permitido para ${file.name}. Solo JPG o PNG`,
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

      try {
        const isValidSize = await this.validateImageDimensions(file);
        if (!isValidSize) {
          await this.toastService.show(
            `${file.name} debe tener mínimo 800x600 píxeles`,
            'warning'
          );
          continue;
        }
      } catch (error) {
        console.warn('Error validando dimensiones:', error);
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      if (input) input.value = '';
      return;
    }

    if (tipo === 'logoFile') {
      this.logoFile = validFiles[0];
    } else if (tipo === 'carrouselPhotos') {
      const totalImages = this.carrouselPhotos.length + validFiles.length;
      if (totalImages > 5) {
        await this.toastService.show(
          'Máximo 5 imágenes permitidas en el carrusel',
          'warning'
        );
        return;
      }
      this.carrouselPhotos = [...this.carrouselPhotos, ...validFiles];
    }

    await this.toastService.show(
      `${validFiles.length} archivo(s) cargado(s) correctamente`,
      'success'
    );
  }

  private validateImageDimensions(file: File): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img.width >= 800 && img.height >= 600);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(false);
      };

      img.src = url;
    });
  }

  onDrop(event: DragEvent, tipo: 'logoFile' | 'carrouselPhotos') {
    event.preventDefault();
    this.onFileChange(event, tipo);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  removeFile(tipo: 'logoFile' | 'carrouselPhotos') {
    if (tipo === 'logoFile') {
      this.logoFile = null as any;
      const input = document.getElementById('logoFileInput') as HTMLInputElement;
      if (input) input.value = '';
    }
  }

  removeCarrouselPhoto(index: number) {
    this.carrouselPhotos.splice(index, 1);
    this.toastService.show('Foto eliminada', 'success');
  }

  private getDateInEcuador(): string {
    const dateInEcuador = new Date().toLocaleDateString("sv-SE", {
      timeZone: "America/Guayaquil",
    });
    return dateInEcuador;
  }

  private sanitizeFormData(formValue: any): any {
    return {
      ...formValue,
      commercialName: formValue.commercialName?.trim(),
      description: formValue.description?.trim(),
      address: formValue.address?.trim(),
      parishCommunitySector: formValue.parishCommunitySector?.trim(),
      website: formValue.website?.trim() || '',
      facebook: formValue.facebook?.trim() || '',
      instagram: formValue.instagram?.trim() || '',
      tiktok: formValue.tiktok?.trim() || '',
      udelSupportDetails: formValue.udelSupportDetails?.trim() || '',
      productsServices: formValue.productsServices?.trim(),

      googleMapsCoordinates: formValue.googleMapsCoordinates?.trim().replace(/\s+/g, ' '),

      acceptsWhatsappOrders: !!formValue.acceptsWhatsappOrders,
      receivedUdelSupport: !!formValue.receivedUdelSupport,

      schedules: formValue.schedules?.trim(),
    };
  }

  private resetForm() {
    this.registerBusiness.reset();
    this.logoFile = null as any;
    this.carrouselPhotos = [];

    this.registerBusiness.patchValue({
      categoryId: this.categories.length > 0 ? this.categories[0].id : null,
      countryCodePhone: '+593',
      countryCode: '+593',
      acceptsWhatsappOrders: false,
      deliveryService: 'NO',
      salePlace: 'NO',
      receivedUdelSupport: false,
      registrationDate: this.getDateInEcuador()
    });
  }

  async onSubmit() {
    if (this.registerBusiness.invalid) {
      await this.toastService.show(
        'Por favor complete todos los campos requeridos',
        'warning'
      );
      return;
    }

    console.log(this.registerBusiness.value)

    if (!this.validateFormBeforeSubmit()) {
      return;
    }

    this.isLoading = true;

    try {
      const formValue = this.sanitizeFormData(this.registerBusiness.value);

      const fullWhatsApp = formValue.acceptsWhatsappOrders
        ? `${formValue.countryCode}${formValue.whatsappNumber}`
        : '';
      const fullPhone = `${formValue.countryCodePhone}${formValue.phone}`;

      const fullSchedules = `${formValue.schedules}` + " - " + `${formValue.schedules1}`;

      const businessData = {
        ...formValue,
        whatsappNumber: fullWhatsApp,
        phone: fullPhone,
        schedules: fullSchedules
      };

      console.log('Datos a enviar:', JSON.stringify(businessData, null, 2));

      const formData = new FormData();

      if (this.logoFile) {
        formData.append('logoFile', this.logoFile);
        console.log('Logo agregado:', this.logoFile.name);
      }

      if (this.carrouselPhotos && this.carrouselPhotos.length > 0) {
        this.carrouselPhotos.forEach((file, index) => {
          formData.append('carrouselPhotos', file);
          console.log(`Foto ${index + 1} agregada:`, file.name);
        });
      }

      formData.append(
        'business',
        new Blob([JSON.stringify(businessData)], { type: 'application/json' })
      );

      console.log('FormData contents:');
      console.log('- Business data:', JSON.stringify(businessData, null, 2));
      if (this.logoFile) {
        console.log('- Logo file:', this.logoFile.name, this.logoFile.size + ' bytes');
      }
      if (this.carrouselPhotos?.length) {
        console.log('- Carousel photos:', this.carrouselPhotos.map(f => f.name + ' (' + f.size + ' bytes)').join(', '));
      }

      const result = await lastValueFrom(this.negocioService.createBusiness(formData));
      console.log('Respuesta del servidor:', result);

      await this.toastService.show('¡Negocio registrado exitosamente!', 'success');
      this.resetForm();
      this.router.navigate(['/mis-negocios']);

    } catch (error: any) {
      console.error('Error completo:', error);
      console.error('Status:', error.status);
      console.error('Response:', error.error);

      let errorMessage = 'Error al registrar el negocio';

      if (error.status === 400) {
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else {
          errorMessage = 'Datos inválidos. Verifique todos los campos.';
        }
      } else if (error.status === 413) {
        errorMessage = 'Los archivos son demasiado grandes.';
      } else if (error.status === 422) {
        errorMessage = 'Error de validación en el servidor.';
      } else if (error.status === 500) {
        errorMessage = 'Error del servidor. Intente más tarde.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      await this.toastService.show(errorMessage, 'danger');
    } finally {
      this.isLoading = false;
    }
  }
}