import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, AlertController, ToastController, ModalController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { DetallePrivadoService, Business, UpdateBusinessRequest } from '../services/detalle-privado.service';
import { NegocioService } from '../services/negocio.service';
import { AuthService } from '../services/auth.service';
import { lastValueFrom } from 'rxjs';

declare var L: any;

@Component({
  selector: 'app-detalle-negocio',
  templateUrl: './detalle-negocio.page.html',
  styleUrls: ['./detalle-negocio.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, ReactiveFormsModule],
})
export class DetalleNegocioPage implements OnInit {
  @ViewChild('editMapContainer', { static: false }) editMapContainer!: ElementRef;

  businessId: number = 0;
  business: Business | null = null;
  currentImageIndex: number = 0;
  loading: boolean = false;
  error: string = '';
  formattedSchedules: { day: string, hours: string }[] = [];
  photoUrls: string[] = [];

  // Modal de edición expandido
  showAdminModal: boolean = false;
  editForm!: FormGroup;
  categories: any[] = [];
  parishes: any[] = [];
  parishTypes = [
    { label: 'Rural', value: 'RURAL' },
    { label: 'Urbana', value: 'URBANA' }
  ];
  selectedParishType: string = 'RURAL';

  // Archivos para edición
  newLogoFile: File | null = null;
  newCarrouselPhotos: File[] = [];
  currentLogoUrl: string = '';
  currentCarrouselUrls: string[] = [];

  // Variables para el mapa en edición
  editMap: any;
  editMarker: any;
  showEditMap = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private detallePrivadoService: DetallePrivadoService,
    private negocioService: NegocioService,
    private authService: AuthService,
    private alertController: AlertController,
    private toastController: ToastController,
    private modalController: ModalController,
    private fb: FormBuilder
  ) {
    this.initializeEditForm();
  }

  async ngOnInit(): Promise<void> {
    console.log('=== DetalleNegocioPage ngOnInit ===');
    
    if (!this.authService.isAuthenticated()) {
      console.log('User not authenticated, redirecting to login');
      this.router.navigate(['/login']);
      return;
    }

    const routeId = this.route.snapshot.paramMap.get('id');
    console.log('Route ID from params:', routeId);
    
    if (routeId && !isNaN(parseInt(routeId, 10))) {
      this.businessId = parseInt(routeId, 10);
      console.log('Business ID set to:', this.businessId);
      await this.loadLeafletScript();
      this.loadBusinessDetails();
      this.loadCategories();
      this.loadParish('RURAL');
    } else {
      console.error('Invalid business ID, redirecting to mis-negocios');
      this.router.navigate(['/mis-negocios']);
    }
  }

  private async loadLeafletScript() {
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

  private initializeEditForm() {
    this.editForm = this.fb.group({
      categoryId: [null, [Validators.required]],
      commercialName: ['', [Validators.required, Validators.maxLength(100)]],
      countryCodePhone: ['+593', Validators.required],
      countryCode: ['+593', Validators.required],
      phone: ['', [Validators.required, Validators.maxLength(9), Validators.pattern('^[0-9]+$')]],
      website: ['', [Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.maxLength(200)]],
      parishCommunitySector: ['', [Validators.required, Validators.maxLength(50)]],
      acceptsWhatsappOrders: [false],
      whatsappNumber: [''],
      googleMapsCoordinates: ['', [Validators.required, Validators.maxLength(100)]],
      deliveryService: ['NO', [Validators.pattern('NO|SI|BAJO_PEDIDO')]],
      salePlace: ['NO', [Validators.pattern('NO|FERIAS|LOCAL_FIJO')]],
      receivedUdelSupport: [false],
      udelSupportDetails: ['', [Validators.maxLength(200)]],
      parishId: [null, [Validators.required]],
      facebook: ['', [Validators.maxLength(100)]],
      instagram: ['', [Validators.maxLength(100)]],
      tiktok: ['', [Validators.maxLength(100)]],
      address: ['', [Validators.required, Validators.maxLength(100)]],
      schedules: ['', [Validators.required, Validators.maxLength(100)]],
      schedules1: ['', [Validators.required, Validators.maxLength(100)]],
      productsServices: ['', [Validators.required, Validators.maxLength(50)]],
      email: ['', [Validators.email, Validators.maxLength(100)]]
    });

    // Validación condicional para WhatsApp
    this.editForm.get('acceptsWhatsappOrders')?.valueChanges.subscribe(accepts => {
      const whatsappControl = this.editForm.get('whatsappNumber');
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

  loadBusinessDetails(): void {
    if (!this.businessId || this.businessId <= 0) {
      this.error = 'ID de negocio inválido';
      console.error('Invalid business ID:', this.businessId);
      return;
    }

    console.log('Loading business details for ID:', this.businessId);
    this.loading = true;
    this.error = '';

    this.detallePrivadoService.getBusinessDetails(this.businessId).subscribe({
      next: (business: Business) => {
        console.log('Business loaded successfully:', business);
        this.business = business;
        
        this.photoUrls = (business && business.photos && Array.isArray(business.photos)) 
          ? this.detallePrivadoService.getPhotoUrls(business.photos) 
          : [];
        
        this.formattedSchedules = (business && business.schedules && Array.isArray(business.schedules)) 
          ? this.detallePrivadoService.formatSchedules(business.schedules) 
          : [];

        // Configurar URLs actuales para la edición
        this.currentLogoUrl = business.logoUrl || '';
        this.currentCarrouselUrls = [...this.photoUrls];
          
        this.loading = false;
        console.log('Business details loaded, photoUrls:', this.photoUrls.length);
        console.log('Business validation status:', business.validationStatus);
      },
      error: (error: any) => {
        console.error('Error loading business details:', error);
        this.error = error.message || 'Error al cargar los detalles del negocio';
        this.loading = false;
        
        if (error.status) {
          console.error('Error status:', error.status);
          console.error('Error message:', error.message);
        }
      }
    });
  }

  private async loadCategories() {
    try {
      this.categories = await lastValueFrom(this.negocioService.getCategories());
      console.log('Categories loaded:', this.categories.length);
    } catch (error) {
      console.error('Error loading categories:', error);
      this.showErrorToast('Error al cargar categorías');
    }
  }

  private loadParish(type: string) {
    this.negocioService.getListParish(type).subscribe({
      next: (response) => {
        this.parishes = response;
        console.log('Parishes loaded:', this.parishes.length);
      },
      error: (error) => {
        console.error('Error loading parishes:', error);
        this.showErrorToast('Error al cargar parroquias');
      },
    });
  }

  onParishTypeSelect(type: string) {
    this.selectedParishType = type;
    this.loadParish(type);
  }

  // =================== GESTIÓN DE ARCHIVOS ===================
  
  async onFileChange(event: Event | DragEvent, tipo: 'logoFile' | 'carrouselPhotos') {
    const input = event.target instanceof HTMLInputElement ? event.target : null;
    const files = input?.files?.length ? input.files : (event as DragEvent).dataTransfer?.files;

    if (!files || files.length === 0) {
      return;
    }

    const validFiles: File[] = [];

    for (const file of Array.from(files)) {
      const validation = await this.detallePrivadoService.validateFile(file, tipo === 'logoFile' ? 'logo' : 'carousel');
      
      if (!validation.isValid) {
        await this.showErrorToast(validation.error || 'Archivo inválido');
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      if (input) input.value = '';
      return;
    }

    if (tipo === 'logoFile') {
      this.newLogoFile = validFiles[0];
    } else if (tipo === 'carrouselPhotos') {
      const totalImages = this.newCarrouselPhotos.length + validFiles.length;
      if (totalImages > 5) {
        await this.showErrorToast('Máximo 5 imágenes permitidas en el carrusel');
        return;
      }
      this.newCarrouselPhotos = [...this.newCarrouselPhotos, ...validFiles];
    }

    await this.showSuccessToast(`${validFiles.length} archivo(s) cargado(s) correctamente`);
  }

  onDrop(event: DragEvent, tipo: 'logoFile' | 'carrouselPhotos') {
    event.preventDefault();
    this.onFileChange(event, tipo);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  removeNewFile(tipo: 'logoFile' | 'carrouselPhotos', index?: number) {
    if (tipo === 'logoFile') {
      this.newLogoFile = null;
      const input = document.getElementById('editLogoFileInput') as HTMLInputElement;
      if (input) input.value = '';
    } else if (tipo === 'carrouselPhotos' && typeof index === 'number') {
      this.newCarrouselPhotos.splice(index, 1);
      this.showSuccessToast('Foto eliminada');
    }
  }

  // =================== FUNCIONES DEL MAPA EN EDICIÓN ===================

  openEditMap() {
    this.showEditMap = true;
    setTimeout(() => {
      this.initEditMap();
    }, 100);
  }

  closeEditMap() {
    this.showEditMap = false;
    if (this.editMap) {
      this.editMap.remove();
      this.editMap = null;
    }
  }

  private initEditMap() {
    if (!this.editMapContainer || this.editMap) return;

    // Usar coordenadas actuales del negocio o por defecto Ibarra
    let defaultLat = 0.3516;
    let defaultLng = -78.1225;

    if (this.business?.googleMapsCoordinates) {
      const coords = this.detallePrivadoService.getCoordinatesArray(this.business.googleMapsCoordinates);
      if (coords && coords[0] !== 0 && coords[1] !== 0) {
        defaultLat = coords[0];
        defaultLng = coords[1];
      }
    }

    this.editMap = L.map(this.editMapContainer.nativeElement).setView([defaultLat, defaultLng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.editMap);

    this.editMarker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(this.editMap);

    // Eventos del mapa
    this.editMap.on('click', (e: any) => {
      this.updateEditMarkerPosition(e.latlng);
    });

    this.editMarker.on('dragend', (e: any) => {
      this.updateEditMarkerPosition(e.target.getLatLng());
    });
  }

  private updateEditMarkerPosition(latlng: any) {
    if (this.editMarker) {
      this.editMarker.setLatLng(latlng);
    }

    const coordinates = `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`;
    this.editForm.patchValue({
      googleMapsCoordinates: coordinates
    });
  }

  centerEditMapOnCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          this.editMap.setView([lat, lng], 15);
          this.updateEditMarkerPosition({ lat, lng });
          this.showSuccessToast('Ubicación actualizada');
        },
        (error) => {
          this.showErrorToast('No se pudo obtener la ubicación actual');
        }
      );
    } else {
      this.showErrorToast('Geolocalización no disponible');
    }
  }

  confirmEditLocation() {
    const coordinates = this.editForm.get('googleMapsCoordinates')?.value;
    if (coordinates && this.detallePrivadoService.validateCoordinates(coordinates)) {
      this.closeEditMap();
      this.showSuccessToast('Ubicación seleccionada correctamente');
    } else {
      this.showErrorToast('Por favor selecciona una ubicación válida en el mapa');
    }
  }

  // =================== VALIDACIONES ===================
  
  hasError(controlName: string): boolean {
    const control = this.editForm.get(controlName);
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  getErrorMessage(controlName: string): string {
    const control = this.editForm.get(controlName);
    if (!control || !control.errors) return '';

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
      'email': {
        'email': 'Formato de correo electrónico inválido',
        'maxlength': 'Máximo 100 caracteres'
      },
      'description': {
        'required': 'La descripción es obligatoria',
        'maxlength': 'Máximo 200 caracteres'
      },
      'address': {
        'required': 'La dirección es obligatoria',
        'maxlength': 'Máximo 100 caracteres'
      },
      'googleMapsCoordinates': {
        'required': 'Debe seleccionar una ubicación en el mapa'
      },
      'productsServices': {
        'required': 'Debe especificar qué productos o servicios ofrece',
        'maxlength': 'Máximo 50 caracteres'
      },
      'schedules': {
        'required': 'El horario de lunes a viernes es obligatorio',
        'maxlength': 'Máximo 100 caracteres'
      },
      'schedules1': {
        'required': 'El horario de fin de semana es obligatorio',
        'maxlength': 'Máximo 100 caracteres'
      }
    };

    if (fieldMessages[controlName]) {
      for (const error in control.errors) {
        if (fieldMessages[controlName][error]) {
          return fieldMessages[controlName][error];
        }
      }
    }

    const genericMessages: Record<string, string> = {
      required: 'Este campo es obligatorio',
      maxlength: `Máximo ${control.errors['maxlength']?.requiredLength} caracteres`,
      email: 'Formato de correo inválido',
      pattern: 'Formato inválido'
    };

    for (const error in control.errors) {
      if (genericMessages[error]) return genericMessages[error];
    }

    return 'Campo inválido';
  }

  // =================== VALIDACIONES ADICIONALES ===================

  private validateFormBeforeSubmit(): boolean {
    // Validar coordenadas
    const coordinates = this.editForm.get('googleMapsCoordinates')?.value;
    if (!this.detallePrivadoService.validateCoordinates(coordinates)) {
      this.showErrorToast('Las coordenadas del mapa no son válidas');
      return false;
    }

    // Validar horarios
    const schedules = this.editForm.get('schedules')?.value;
    const schedules1 = this.editForm.get('schedules1')?.value;
    
    if (schedules && !this.detallePrivadoService.validateScheduleFormat(schedules)) {
      this.showErrorToast('Formato de horario inválido para lunes-viernes. Use "HH:MM - HH:MM"');
      return false;
    }

    if (schedules1 && !this.detallePrivadoService.validateScheduleFormat(schedules1)) {
      this.showErrorToast('Formato de horario inválido para fin de semana. Use "HH:MM - HH:MM"');
      return false;
    }

    // Validar teléfono ecuatoriano si aplica
    const countryCode = this.editForm.get('countryCodePhone')?.value;
    const phone = this.editForm.get('phone')?.value;
    if (countryCode === '+593' && phone) {
      if (!this.detallePrivadoService.validateEcuadorianPhone(phone)) {
        this.showErrorToast('Número de teléfono ecuatoriano inválido');
        return false;
      }
    }

    return true;
  }

  // =================== FUNCIONES DEL MODAL ===================

  openAdminModal(): void {
    console.log('Opening expanded edit modal');
    if (!this.business) return;

    // Poblar el formulario con los datos actuales
    this.populateEditForm();
    
    // Resetear archivos nuevos
    this.newLogoFile = null;
    this.newCarrouselPhotos = [];
    
    this.showAdminModal = true;
  }

  private populateEditForm(): void {
    if (!this.business) return;

    // Separar los horarios combinados
    let weekdaySchedule = '';
    let weekendSchedule = '';
    
    if (this.business.schedules && Array.isArray(this.business.schedules)) {
      const weekdaySchedules = this.business.schedules.filter(s => s.dayOfWeek >= 1 && s.dayOfWeek <= 5);
      const weekendSchedules = this.business.schedules.filter(s => s.dayOfWeek === 0 || s.dayOfWeek === 6);
      
      if (weekdaySchedules.length > 0) {
        const schedule = weekdaySchedules[0];
        weekdaySchedule = schedule.isClosed ? 'Cerrado' : `${schedule.openTime} - ${schedule.closeTime}`;
      }
      
      if (weekendSchedules.length > 0) {
        const schedule = weekendSchedules[0];
        weekendSchedule = schedule.isClosed ? 'Cerrado' : `${schedule.openTime} - ${schedule.closeTime}`;
      }
    }

    // Extraer códigos de país y números de teléfono
    let phoneCode = '+593';
    let phoneNumber = '';
    if (this.business.phone) {
      const phone = this.business.phone.replace(/\D/g, '');
      if (phone.startsWith('593')) {
        phoneCode = '+593';
        phoneNumber = phone.substring(3);
      } else if (phone.startsWith('57')) {
        phoneCode = '+57';
        phoneNumber = phone.substring(2);
      } else {
        phoneNumber = phone;
      }
    }

    let whatsappCode = '+593';
    let whatsappNumber = '';
    if (this.business.whatsappNumber) {
      const whatsapp = this.business.whatsappNumber.replace(/\D/g, '');
      if (whatsapp.startsWith('593')) {
        whatsappCode = '+593';
        whatsappNumber = whatsapp.substring(3);
      } else if (whatsapp.startsWith('57')) {
        whatsappCode = '+57';
        whatsappNumber = whatsapp.substring(2);
      } else {
        whatsappNumber = whatsapp;
      }
    }

    this.editForm.patchValue({
      categoryId: this.business.category?.id || null,
      commercialName: this.business.commercialName || '',
      countryCodePhone: phoneCode,
      countryCode: whatsappCode,
      phone: phoneNumber,
      website: this.business.website || '',
      description: this.business.description || '',
      parishCommunitySector: this.business.parishCommunitySector || '',
      acceptsWhatsappOrders: this.business.acceptsWhatsappOrders || false,
      whatsappNumber: whatsappNumber,
      googleMapsCoordinates: this.business.googleMapsCoordinates || '',
      deliveryService: this.business.deliveryService || 'NO',
      salePlace: this.business.salePlace || 'NO',
      receivedUdelSupport: this.business.receivedUdelSupport || false,
      udelSupportDetails: this.business.udelSupportDetails || '',
      parishId: this.business.parish?.id || null,
      facebook: this.business.facebook || '',
      instagram: this.business.instagram || '',
      tiktok: this.business.tiktok || '',
      address: this.business.address || '',
      schedules: weekdaySchedule,
      schedules1: weekendSchedule,
      productsServices: this.business.productsServices || '',
      email: this.business.email || ''
    });
  }

  closeAdminModal(): void {
    console.log('Closing expanded edit modal');
    this.showAdminModal = false;
    this.closeEditMap();
    this.newLogoFile = null;
    this.newCarrouselPhotos = [];
    this.editForm.reset();
  }

  async saveBusinessChanges(): Promise<void> {
    if (!this.business || !this.businessId) {
      console.error('Cannot save: business or businessId is missing');
      this.showErrorToast('Error: Información del negocio no disponible');
      return;
    }

    if (this.editForm.invalid) {
      this.showErrorToast('Por favor complete todos los campos requeridos');
      this.markFormGroupTouched(this.editForm);
      return;
    }

    if (!this.validateFormBeforeSubmit()) {
      return;
    }

    console.log('=== SAVING BUSINESS CHANGES ===');

    try {
      this.loading = true;
      const formValue = this.sanitizeFormData(this.editForm.value);

      // Preparar datos según si hay archivos nuevos o no
      const hasNewFiles = this.newLogoFile || this.newCarrouselPhotos.length > 0;

      if (hasNewFiles) {
        await this.saveWithFiles(formValue);
      } else {
        await this.saveWithoutFiles(formValue);
      }

      this.showSuccessToast('Negocio actualizado exitosamente');
      this.closeAdminModal();
      
      // Recargar datos
      setTimeout(() => {
        this.loadBusinessDetails();
      }, 500);

      if (this.business?.validationStatus === 'REJECTED') {
        setTimeout(() => {
          this.showInfoToast('Tu negocio se ha actualizado. Será revisado nuevamente para validación.');
        }, 1000);
      }
      
    } catch (error: any) {
      console.error('Error updating business:', error);
      this.showErrorToast(error.message || 'Error al actualizar el negocio');
    } finally {
      this.loading = false;
    }
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
      email: formValue.email?.trim() || '',
      googleMapsCoordinates: formValue.googleMapsCoordinates?.trim().replace(/\s+/g, ' '),
      acceptsWhatsappOrders: !!formValue.acceptsWhatsappOrders,
      receivedUdelSupport: !!formValue.receivedUdelSupport,
      schedules: formValue.schedules?.trim(),
      schedules1: formValue.schedules1?.trim()
    };
  }

  private async saveWithFiles(formValue: any): Promise<void> {
    const formData = new FormData();

    // Agregar archivos
    if (this.newLogoFile) {
      formData.append('logoFile', this.newLogoFile);
      console.log('New logo file added:', this.newLogoFile.name);
    }

    this.newCarrouselPhotos.forEach((file) => {
      formData.append('carrouselPhotos', file);
      console.log('New carousel photo added:', file.name);
    });

    // Preparar datos del negocio
    const fullWhatsApp = formValue.acceptsWhatsappOrders
      ? `${formValue.countryCode}${formValue.whatsappNumber}`
      : '';
    const fullPhone = `${formValue.countryCodePhone}${formValue.phone}`;
    const fullSchedules = `${formValue.schedules} - ${formValue.schedules1}`;

    const businessData = {
      categoryId: formValue.categoryId,
      commercialName: formValue.commercialName?.trim(),
      phone: fullPhone,
      website: formValue.website?.trim() || '',
      description: formValue.description?.trim(),
      parishCommunitySector: formValue.parishCommunitySector?.trim(),
      acceptsWhatsappOrders: formValue.acceptsWhatsappOrders,
      whatsappNumber: fullWhatsApp,
      googleMapsCoordinates: formValue.googleMapsCoordinates?.trim(),
      deliveryService: formValue.deliveryService,
      salePlace: formValue.salePlace,
      receivedUdelSupport: formValue.receivedUdelSupport,
      udelSupportDetails: formValue.udelSupportDetails?.trim() || '',
      parishId: formValue.parishId,
      facebook: formValue.facebook?.trim() || '',
      instagram: formValue.instagram?.trim() || '',
      tiktok: formValue.tiktok?.trim() || '',
      address: formValue.address?.trim(),
      schedules: fullSchedules,
      productsServices: formValue.productsServices?.trim(),
      email: formValue.email?.trim() || '',
      registrationDate: this.business?.registrationDate || new Date().toISOString()
    };

    formData.append('business', new Blob([JSON.stringify(businessData)], { type: 'application/json' }));

    console.log('FormData prepared with business data:', JSON.stringify(businessData, null, 2));

    // Decidir qué endpoint usar según el estado del negocio
    let result;
    if (this.business?.validationStatus === 'REJECTED') {
      result = await lastValueFrom(this.negocioService.updateRejectedBusiness(this.businessId, formData));
    } else {
      result = await lastValueFrom(this.negocioService.updateBusinessWithFiles(this.businessId, formData));
    }
    
    console.log('Update with files response:', result);
  }

  private async saveWithoutFiles(formValue: any): Promise<void> {
    const updateData: UpdateBusinessRequest = {
      commercialName: formValue.commercialName?.trim(),
      description: formValue.description?.trim(),
      facebook: formValue.facebook?.trim(),
      instagram: formValue.instagram?.trim(),
      tiktok: formValue.tiktok?.trim(),
      website: formValue.website?.trim(),
      email: formValue.email?.trim(),
      address: formValue.address?.trim(),
      acceptsWhatsappOrders: Boolean(formValue.acceptsWhatsappOrders),
      googleMapsCoordinates: formValue.googleMapsCoordinates?.trim(),
      deliveryService: formValue.deliveryService,
      salePlace: formValue.salePlace,
      parishCommunitySector: formValue.parishCommunitySector?.trim(),
      productsServices: formValue.productsServices?.trim(),
      categoryId: formValue.categoryId,
      parishId: formValue.parishId,
      receivedUdelSupport: Boolean(formValue.receivedUdelSupport),
      udelSupportDetails: formValue.udelSupportDetails?.trim()
    };

    // Agregar teléfono completo
    if (formValue.phone) {
      updateData.phone = `${formValue.countryCodePhone}${formValue.phone}`;
    }

    // Agregar WhatsApp si está habilitado
    if (formValue.acceptsWhatsappOrders && formValue.whatsappNumber) {
      updateData.whatsappNumber = `${formValue.countryCode}${formValue.whatsappNumber}`;
    }

    // Combinar horarios
    if (formValue.schedules && formValue.schedules1) {
      updateData.schedules = `${formValue.schedules} - ${formValue.schedules1}`;
    }

    console.log('Update data:', updateData);

    const result = await lastValueFrom(
      this.detallePrivadoService.updateBusiness(
        this.businessId, 
        updateData, 
        this.business?.validationStatus
      )
    );
    
    console.log('Update without files response:', result);
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  // =================== FUNCIONES EXISTENTES ===================

  nextImage(): void {
    if (this.photoUrls && Array.isArray(this.photoUrls) && this.photoUrls.length > 0) {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.photoUrls.length;
    }
  }

  prevImage(): void {
    if (this.photoUrls && Array.isArray(this.photoUrls) && this.photoUrls.length > 0) {
      this.currentImageIndex = this.currentImageIndex === 0 
        ? this.photoUrls.length - 1 
        : this.currentImageIndex - 1;
    }
  }

  selectImage(index: number): void {
    if (typeof index === 'number' && 
        index >= 0 && 
        this.photoUrls && 
        Array.isArray(this.photoUrls) && 
        index < this.photoUrls.length) {
      this.currentImageIndex = index;
    }
  }

  openAdministrationPanel(): void {
    console.log('Navigating to promotions with business ID:', this.businessId);
    this.router.navigate(['/promociones', this.businessId]);
  }

  async openDeleteFunctionality(): Promise<void> {
    console.log('Opening delete functionality modal for business ID:', this.businessId);
    
    try {
      const modal = await this.modalController.create({
        component: (await import('../eliminar-negocio/eliminar-negocio.page')).EliminarNegocioPage,
        componentProps: {
          businessId: this.businessId,
          businessName: this.business?.commercialName || 'Negocio sin nombre'
        },
        backdropDismiss: false,
        cssClass: 'delete-business-modal'
      });
      await modal.present();
      
      const { data } = await modal.onWillDismiss();
      
      if (data === true) {
        this.showSuccessToast('Solicitud de eliminación enviada correctamente');
        setTimeout(() => {
          this.goBack();
        }, 1500);
      }
      
    } catch (error) {
      console.error('Error opening delete modal:', error);
      this.router.navigate(['/eliminar-negocio', this.businessId]);
    }
  }

  // =================== FUNCIONES AUXILIARES ===================

  openSocialMedia(platform: string): void {
    if (!this.business || !platform) return;

    let url = '';
    switch (platform) {
      case 'facebook':
        if (this.business.facebook) {
          url = this.business.facebook.startsWith('http') 
            ? this.business.facebook 
            : `https://facebook.com/${this.business.facebook}`;
        }
        break;
      case 'instagram':
        if (this.business.instagram) {
          url = this.business.instagram.startsWith('http') 
            ? this.business.instagram 
            : `https://instagram.com/${this.business.instagram}`;
        }
        break;
      case 'tiktok':
        if (this.business.tiktok) {
          url = this.business.tiktok.startsWith('http') 
            ? this.business.tiktok 
            : `https://tiktok.com/@${this.business.tiktok}`;
        }
        break;
      case 'website':
        if (this.business.website) {
          url = this.business.website;
        }
        break;
    }

    if (url && url.length > 10) { 
      window.open(url, '_blank');
    }
  }

  openWhatsApp(): void {
    if (this.business?.whatsappNumber) {
      const cleanNumber = this.business.whatsappNumber.replace(/\D/g, '');
      if (cleanNumber.length > 5) { 
        const url = `https://wa.me/${cleanNumber}`;
        window.open(url, '_blank');
      }
    }
  }

  openMaps(): void {
    if (this.business?.googleMapsCoordinates) {
      const coords = this.detallePrivadoService.getCoordinatesArray(this.business.googleMapsCoordinates);
      if (coords && Array.isArray(coords) && coords.length === 2 && coords[0] !== 0 && coords[1] !== 0) {
        const url = `https://www.google.com/maps?q=${coords[0]},${coords[1]}`;
        window.open(url, '_blank');
      }
    }
  }

  callPhone(): void {
    if (this.business?.phone) {
      window.open(`tel:${this.business.phone}`, '_self');
    }
  }

  sendEmail(): void {
    if (this.business?.email) {
      window.open(`mailto:${this.business.email}`, '_self');
    }
  }

  async showSuccessToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color: 'success'
    });
    toast.present();
  }

  async showErrorToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color: 'danger'
    });
    toast.present();
  }

  async showInfoToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color: 'primary'
    });
    toast.present();
  }

  get currentImage(): string {
    if (this.photoUrls && 
        Array.isArray(this.photoUrls) && 
        this.photoUrls.length > 0 && 
        typeof this.currentImageIndex === 'number' &&
        this.currentImageIndex >= 0 && 
        this.currentImageIndex < this.photoUrls.length &&
        this.photoUrls[this.currentImageIndex]) {
      return this.photoUrls[this.currentImageIndex];
    }
    return 'assets/icon/ibarra.jpg';
  }

  get hasMultipleImages(): boolean {
    return this.photoUrls && Array.isArray(this.photoUrls) && this.photoUrls.length > 1;
  }

  get deliveryText(): string {
    if (!this.business || !this.business.deliveryService) return 'Sin servicio de delivery';
    return this.business.deliveryService === 'SI' ? 'Servicio de delivery disponible' : 'Sin servicio de delivery';
  }

  get salePlaceText(): string {
    if (!this.business || !this.business.salePlace) return 'No especificado';
    
    const places: { [key: string]: string } = {
      'LOCAL_FIJO': 'Local físico',
      'DELIVERY': 'Solo delivery',
      'AMBOS': 'Local físico y delivery'
    };
    return places[this.business.salePlace] || this.business.salePlace;
  }

  get businessName(): string {
    return this.business?.commercialName || '';
  }

  handleImageError(event: any, imageType: string = 'carousel'): void {
    if (!event || !event.target) return;
    
    console.log('Image error for type:', imageType);
    if (imageType === 'carousel') {
      event.target.src = 'assets/icon/ibarra.jpg';
    } else if (imageType === 'logo' && this.business) {
      this.business.logoUrl = 'assets/icon/ibarra.jpg';
    }
  }

  goBack(): void {
    console.log('Going back to mis-negocios');
    this.router.navigate(['/mis-negocios']);
  }

  canEditBusiness(): boolean {
    if (!this.business) return false;
    
    const editableStatuses = ['VALIDATED', 'REJECTED', 'PENDING'];
    return editableStatuses.includes(this.business.validationStatus);
  }

  get editButtonText(): string {
    if (!this.business) return 'Editar datos del negocio';
    
    if (this.business.validationStatus === 'REJECTED') {
      return 'Corregir y editar negocio';
    }
    return 'Editar datos del negocio';
  }
}