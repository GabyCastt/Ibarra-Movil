import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, ModalController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { DetallePrivadoService, Business } from '../services/detalle-privado.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-detalle-negocio',
  templateUrl: './detalle-negocio.page.html',
  styleUrls: ['./detalle-negocio.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class DetalleNegocioPage implements OnInit {
  businessId: number = 0;
  business: Business | null = null;
  currentImageIndex: number = 0;
  loading: boolean = false;
  error: string = '';
  formattedSchedules: { day: string, hours: string }[] = [];
  photoUrls: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private detallePrivadoService: DetallePrivadoService,
    private authService: AuthService,
    private toastController: ToastController,
    private modalController: ModalController
  ) {}

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
      this.loadBusinessDetails();
    } else {
      console.error('Invalid business ID, redirecting to mis-negocios');
      this.router.navigate(['/mis-negocios']);
    }
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
        
        // Procesar imágenes del carrusel
        console.log('Processing business photos:', business.photos);
        this.photoUrls = (business && business.photos && Array.isArray(business.photos)) 
          ? this.detallePrivadoService.getBusinessCarouselPhotoUrls(business.photos) 
          : [];
        
        console.log(' Final photoUrls array:', this.photoUrls);
        
        // Procesar horarios
        this.formattedSchedules = (business && business.schedules && Array.isArray(business.schedules)) 
          ? this.detallePrivadoService.formatSchedules(business.schedules) 
          : [];

        // Resetear índice del carrusel
        this.currentImageIndex = 0;
          
        this.loading = false;
        console.log('[OK] Business details loaded successfully');
        console.log(`Photo URLs count: ${this.photoUrls.length}`);
        console.log(` Business validation status: ${business.validationStatus}`);
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

  // CARRUSEL DE IMÁGENES 

  nextImage(): void {
    if (this.photoUrls && Array.isArray(this.photoUrls) && this.photoUrls.length > 0) {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.photoUrls.length;
      console.log(`🎠 Next image: ${this.currentImageIndex + 1}/${this.photoUrls.length}`);
    }
  }

  prevImage(): void {
    if (this.photoUrls && Array.isArray(this.photoUrls) && this.photoUrls.length > 0) {
      this.currentImageIndex = this.currentImageIndex === 0 
        ? this.photoUrls.length - 1 
        : this.currentImageIndex - 1;
      console.log(`🎠 Previous image: ${this.currentImageIndex + 1}/${this.photoUrls.length}`);
    }
  }

  selectImage(index: number): void {
    if (typeof index === 'number' && 
        index >= 0 && 
        this.photoUrls && 
        Array.isArray(this.photoUrls) && 
        index < this.photoUrls.length) {
      this.currentImageIndex = index;
      console.log(`🎠 Selected image: ${this.currentImageIndex + 1}/${this.photoUrls.length}`);
    }
  }

  // =================== NAVEGACIÓN Y FUNCIONES DE BOTONES ===================

  /**
   * Función placeholder para el botón de editar (sin funcionalidad)
   */
  editBusiness(): void {    
      this.router.navigate(['/editar-negocio', this.businessId, this.business?.validationStatus]);
  }

  /**
   * Abre el panel de administración (promociones)
   */
  openAdministrationPanel(): void {
    console.log('Navigating to promotions with business ID:', this.businessId);
    this.router.navigate(['/promociones', this.businessId]);
  }

  /**
   * Abre la funcionalidad de solicitar eliminación
   */
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

  /**
   * Volver a la lista de negocios
   */
  goBack(): void {
    console.log('Going back to mis-negocios');
    this.router.navigate(['/mis-negocios']);
  }

  // =================== FUNCIONES AUXILIARES PARA ENLACES EXTERNOS ===================

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

  // =================== FUNCIONES DE NOTIFICACIONES ===================

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

  // =================== GETTERS PARA TEMPLATE ===================

  /**
   * Determina si mostrar el botón de editar según el estado
   * Solo VALIDATED y REJECTED pueden editarse/corregirse
   * PENDING no se puede editar ni corregir
   */
  get shouldShowEditButton(): boolean {
    if (!this.business) return false;
    
    // Solo mostrar para VALIDATED y REJECTED
    const editableStatuses = ['VALIDATED', 'REJECTED', 'APPROVED'];
    return editableStatuses.includes(this.business.validationStatus);
  }

  /**
   * Determina si mostrar el botón de administrar negocio
   * Solo VALIDATED puede administrar el negocio
   */
  get shouldShowAdminButton(): boolean {
    if (!this.business) return false;
    
    // Solo mostrar para VALIDATED únicamente
    return this.business.validationStatus === 'VALIDATED';
  }

  /**
   * Determina si mostrar el botón de solicitar eliminación
   * Todos los estados pueden solicitar eliminación
   */
  get shouldShowDeleteButton(): boolean {
    if (!this.business) return false;
    
    // Mostrar para todos los estados
    const deleteStatuses = ['VALIDATED', 'REJECTED', 'PENDING'];
    return deleteStatuses.includes(this.business.validationStatus);
  }

  /**
   * Texto del botón según el estado del negocio
   */
  get editButtonText(): string {
    if (!this.business) return 'Editar Negocio';
    
    switch (this.business.validationStatus) {
      case 'REJECTED':
        return 'Corregir Negocio';
      case 'VALIDATED':
      case 'APPROVED':
        return 'Editar Negocio';
      default:
        return 'Editar Negocio';
    }
  }

  /**
   * Subtítulo del botón según el estado
   */
  get editButtonSubtitle(): string {
    if (!this.business) return '';
    
    switch (this.business.validationStatus) {
      case 'REJECTED':
        return 'Corregir datos para nueva validación';
      case 'VALIDATED':
      case 'APPROVED':
        return 'Modificar datos del negocio';
      default:
        return 'Modificar información';
    }
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

  get businessStatusText(): string {
    if (!this.business) return '';
    
    const statusTexts: { [key: string]: string } = {
      'VALIDATED': 'Validado',
      'PENDING': 'Pendiente',
      'REJECTED': 'Rechazado'
    };
    
    return statusTexts[this.business.validationStatus] || this.business.validationStatus;
  }

  get businessStatusClass(): string {
    if (!this.business) return '';
    
    const statusClasses: { [key: string]: string } = {
      'VALIDATED': 'validated',
      'PENDING': 'pending',
      'REJECTED': 'rejected'
    };
    
    return statusClasses[this.business.validationStatus] || '';
  }

  // =================== MANEJO DE ERRORES EN IMÁGENES ===================

  handleImageError(event: any, imageType: string = 'carousel'): void {
    if (!event || !event.target) return;
    
    console.log('Image error for type:', imageType);
    if (imageType === 'carousel') {
      event.target.src = 'assets/icon/ibarra.jpg';
    } else if (imageType === 'logo' && this.business) {
      this.business.logoUrl = 'assets/icon/ibarra.jpg';
    }
  }
}