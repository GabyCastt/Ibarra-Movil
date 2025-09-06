import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Form, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { Business, DetallePrivadoService } from '../services/detalle-privado.service';
import { NegociosService } from '../services/negocios.service';
import { EditarNegocioService } from '../services/editar-negocio.service';
import { ToastService } from '../services/toast.service';
import { lastValueFrom } from 'rxjs';

declare var L: any;
@Component({
  selector: 'app-editar-negocio',
  templateUrl: './editar-negocio.page.html',
  styleUrls: ['./editar-negocio.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, ReactiveFormsModule],
})
export class EditarNegocioPage implements OnInit {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

  editBusiness!: FormGroup;
  logoFile!: File;

  businessId!: string;
  backUrl!: string;
  business: Business | null = null;
  carrouselPhotos: File[] = [];

  categories: any[] = [];
  selectedCategoryId: number | undefined = undefined;
  isLoading = false;
  map: any;
  marker: any;
  showMap = false;


  constructor(
    private fb: FormBuilder,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private detallePrivadoService: DetallePrivadoService,
    private negociosService: NegociosService,
    private eeditarNegocioService: EditarNegocioService
  ) {
    this.initializeForm();
  }

  async ngOnInit() {
    this.businessId = this.route.snapshot.paramMap.get('id')!;
    this.backUrl = `/detalle-negocio/${this.businessId}`;
    this.loadBusinessDetails();
    this.loadCategories();

    await this.loadLeafletScript();
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


  private initializeForm() {
    this.editBusiness = this.fb.group({
      categoryId: ["", [Validators.required]],
      commercialName: ["", [Validators.required, Validators.maxLength(100)]],
      countryCodePhone: ['+593', Validators.required],
      countryCode: ['+593', Validators.required],
      phone: ['', [Validators.required, Validators.maxLength(9), Validators.pattern('^[0-9]+$')]],
      website: ['', [Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.maxLength(200)]],
      acceptsWhatsappOrders: [false],
      whatsappNumber: [''],
      googleMapsCoordinates: ['', [Validators.required, Validators.maxLength(100)]],
      deliveryService: ['NO', [Validators.pattern('NO|SI|BAJO_PEDIDO')]],
      salePlace: ['NO', [Validators.pattern('NO|FERIAS|LOCAL_FIJO')]],
      facebook: ['', [Validators.maxLength(100)]],
      instagram: ['', [Validators.maxLength(100)]],
      tiktok: ['', [Validators.maxLength(100)]],
      address: ['', [Validators.required, Validators.maxLength(100)]],
      schedules: ['', [Validators.required, Validators.maxLength(100)]],
    });

    this.editBusiness.get('acceptsWhatsappOrders')?.valueChanges.subscribe(accepts => {
      const whatsappControl = this.editBusiness.get('whatsappNumber');
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

  hasError(controlName: string): boolean {
    const control = this.editBusiness.get(controlName);
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  getErrorMessage(controlName: string): string {
    const control = this.editBusiness.get(controlName);
    if (!control || !control.errors) return '';

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

  loadBusinessDetails(): void {
    this.detallePrivadoService.getBusinessDetails(Number(this.businessId)).subscribe({
      next: (business: Business) => {
        this.business = business;

        this.editBusiness.patchValue({
          categoryId: business.category?.id,
          commercialName: business.commercialName,
          countryCodePhone: '+593',
          countryCode: '+593',
          phone: business.phone,
          website: business.website,
          description: business.description,
          acceptsWhatsappOrders: business.acceptsWhatsappOrders,
          googleMapsCoordinates: business.googleMapsCoordinates,
          deliveryService: business.deliveryService,
          facebook: business.facebook,
          instagram: business.instagram,
          tiktok: business.tiktok,
          address: business.address,
          schedules: business.schedules,
        });
      },
      error: (error) => {
        console.error('Error fetching business details:', error);
      }
    });
  }

  private async loadCategories() {
    try {
      const categories = await this.negociosService.getCategorias().toPromise();
      this.categories = (categories || []).map((category) => ({
        ...category,
      }));
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  async onSubmit() {
    if (this.editBusiness.invalid) {
      await this.toastService.show(
        'Por favor complete todos los campos requeridos',
        'warning'
      );
      return;
    }
    this.isLoading = true;
    try {
      const formValue = this.editBusiness.value;
      const fullWhatsApp = formValue.acceptsWhatsappOrders
        ? `${formValue.countryCode}${formValue.whatsappNumber}`
        : '';
      const fullPhone = `${formValue.countryCodePhone}${formValue.phone}`;
      const businessData = {
        ...formValue,
        phone: fullPhone,
        whatsappNumber: fullWhatsApp,
      };
      const formData = new FormData();
      formData.append(
        'business',
        new Blob([JSON.stringify(businessData)], { type: 'application/json' })
      );
      if (this.logoFile) {
        formData.append('logoFile', this.logoFile);
      }
       if (this.carrouselPhotos && this.carrouselPhotos.length > 0) {
        this.carrouselPhotos.forEach((file, index) => {
          formData.append('carouselFiles', file);
          console.log(`Foto ${index + 1} agregada:`, file.name);
        });
      }
      const result = await lastValueFrom(this.eeditarNegocioService.updateBusiness(Number(this.businessId), formData));
      await this.toastService.show('Negocio actualizado con éxito', 'success');
      this.editBusiness.reset();
      window.location.href = `/detalle-negocio/${this.businessId}`;

    } catch (error: any) {
      console.error('Error updating business:', error);
      const errorMessage = error?.message || 'Error actualizando el negocio';
      await this.toastService.show(errorMessage, 'danger');
    } finally {
      this.isLoading = false;
    }
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
    this.editBusiness.patchValue({
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
    const coordinates = this.editBusiness.get('googleMapsCoordinates')?.value;
    if (coordinates) {
      this.closeMap();
      this.toastService.show('Ubicación seleccionada correctamente', 'success');
    } else {
      this.toastService.show('Por favor selecciona una ubicación en el mapa', 'warning');
    }
  }

  // Imagenes
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


}

