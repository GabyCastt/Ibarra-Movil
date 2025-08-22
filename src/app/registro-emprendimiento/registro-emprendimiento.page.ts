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
    this.registerBusiness.patchValue({
      registrationDate: this.getDateInEcuador(),
    });
    
    // Cargar Leaflet dinámicamente
    await this.loadLeafletScript();
  }

  ngAfterViewInit() {
    // El mapa se inicializará cuando el usuario haga clic en "Abrir Mapa"
  }

  async loadLeafletScript() {
    if (typeof L !== 'undefined') {
      return; 
    }

    return new Promise<void>((resolve) => {
    
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(cssLink);

     
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => resolve();
      document.head.appendChild(script);
    });
  }

  async loadCategories() {
    try {
      this.categories = await this.negocioService.getCategories().toPromise();
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
      countryCodePhone: ['+593', Validators.required],
      countryCode: ['+593', Validators.required],
      phone: ['', [Validators.required, Validators.maxLength(9), Validators.pattern('^[0-9]*$')]],
      website: ['', [Validators.maxLength(50)]],
      description: ['', [Validators.required, Validators.maxLength(200)]],
      parishCommunitySector: ['', Validators.required, [Validators.maxLength(50)]],
      acceptsWhatsappOrders: [false],
      whatsappNumber: ['', [Validators.required, Validators.maxLength(9), Validators.pattern('^[0-9]*$')]],
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
        [
          this.fb.control('', Validators.required),
          this.fb.control('', Validators.required)
        ],
        Validators.required
      ),
      productsServices: ['Banana', [Validators.required, Validators.maxLength(50)]],
    });
  }

  // Funciones del mapa
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

    // Coordenadas por defecto (Santo Domingo de los Colorados(Aqui se puede cambiar OK tener en cuenta ya que es para IBARRA ), Ecuador)
    const defaultLat = -0.25;
    const defaultLng = -79.17;


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
          this.toastService.show('No se pudo obtener la ubicación actual', 'warning');
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
          this.toastService.show('No se pudo obtener la ubicación actual', 'error');
        }
      );
    } else {
      this.toastService.show('Geolocalización no disponible', 'error');
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

  private getDateInEcuador(): string {
    const dateInEcuador = new Date().toLocaleDateString("sv-SE", {
      timeZone: "America/Guayaquil",
    });
    return dateInEcuador;
  }

  isLoading = false;

  async onSubmit() {
    if (this.registerBusiness.invalid) {
      await this.toastService.show(
        'Por favor complete todos los campos requeridos',
        'warning'
      );
      return;
    }
    const formValue = this.registerBusiness.value;
    const fullWhatsApp = `${formValue.countryCode}${formValue.whatsappNumber}`;
    const fullPhone = `${formValue.countryCodePhone}${formValue.phone}`;
    const formData = new FormData();
    formData.append('logoFile', this.logoFile);
    this.carrouselPhotos.forEach((file) => {
      formData.append('carrouselPhotos', file);
    });

    formData.append(
      'business',
      new Blob(
        [
          JSON.stringify({
            ...this.registerBusiness.value,
            whatsappNumber: fullWhatsApp,
            phone: fullPhone
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

  async onFileChange(
    event: Event | DragEvent,
    tipo: 'logoFile' | 'carrouselPhotos'
  ) {
    const input =
      event.target instanceof HTMLInputElement ? event.target : null;
    const files = input?.files?.length
      ? input.files
      : (event as DragEvent).dataTransfer?.files;

    if (!files || files.length === 0) {
      return;
    }

    const allowedExtensions = ['jpg', 'jpeg', 'png'];
    const maxSize = 2 * 1024 * 1024;

    const validFiles: File[] = [];
    for (const file of Array.from(files)) {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!extension || !allowedExtensions.includes(extension)) {
        await this.toastService.show(
          'Formato no permitido. Solo JPG o PNG',
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
    } else if (tipo === 'carrouselPhotos') {
      this.carrouselPhotos = [...this.carrouselPhotos, ...validFiles];
    }

    await this.toastService.show(
      'Archivo(s) cargado(s) correctamente',
      'success'
    );
  }

  onDrop(
    event: DragEvent,
    tipo: 'logoFile' | 'carrouselPhotos'
  ) {
    event.preventDefault();
    this.onFileChange(event, tipo);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  private clearFile(
    tipo: 'logoFile' | 'carrouselPhotos'
  ) {
    if (tipo === 'logoFile') {
      this.logoFile = null as any;
    } else if (tipo === 'carrouselPhotos') {
      this.carrouselPhotos = [];
    }
  }
}