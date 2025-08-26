import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { DetallePrivadoService, Business, UpdateBusinessRequest } from '../services/detalle-privado.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-detalle-negocio',
  templateUrl: './detalle-negocio.page.html',
  styleUrls: ['./detalle-negocio.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
})
export class DetalleNegocioPage implements OnInit {
  businessId: number = 0;
  business: Business | null = null;
  currentImageIndex: number = 0;
  loading: boolean = false;
  error: string = '';
  formattedSchedules: { day: string, hours: string }[] = [];
  photoUrls: string[] = [];

  showAdminModal: boolean = false;
  editableBusiness: Partial<Business> = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private detallePrivadoService: DetallePrivadoService,
    private authService: AuthService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  ngOnInit(): void {
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
        this.editableBusiness = { ...business };
        
        this.photoUrls = (business && business.photos && Array.isArray(business.photos)) 
          ? this.detallePrivadoService.getPhotoUrls(business.photos) 
          : [];
        
        this.formattedSchedules = (business && business.schedules && Array.isArray(business.schedules)) 
          ? this.detallePrivadoService.formatSchedules(business.schedules) 
          : [];
          
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

  openAdminModal(): void {
    console.log('Opening edit data modal');
    this.editableBusiness = this.business ? { ...this.business } : {};
    this.showAdminModal = true;
  }

  closeAdminModal(): void {
    console.log('Closing edit data modal');
    this.showAdminModal = false;
    this.editableBusiness = {};
  }

  openAdministrationPanel(): void {
    console.log('Opening administration panel');
    this.showInfoToast('Panel de administración - Funcionalidad próximamente');
  }

  openDeleteFunctionality(): void {
    console.log('Opening delete functionality');
    this.showInfoToast('Eliminar negocio - Funcionalidad próximamente');
  }

  async saveBusinessChanges(): Promise<void> {
    if (!this.business || !this.businessId) {
      console.error('Cannot save: business or businessId is missing');
      this.showErrorToast('Error: Información del negocio no disponible');
      return;
    }

    console.log('=== SAVING BUSINESS CHANGES ===');
    console.log('Business ID:', this.businessId);
    console.log('Business validation status:', this.business.validationStatus);
    console.log('Original business:', this.business);
    console.log('Editable business:', this.editableBusiness);

    if (this.business.validationStatus === 'VALIDATED') {
      console.log('Editing validated business');
    } else if (this.business.validationStatus === 'REJECTED') {
      console.log('Editing rejected business - allowing modifications');
    } else if (this.business.validationStatus === 'PENDING') {
      console.log('Editing pending business');
    }

    if (!this.editableBusiness.commercialName || this.editableBusiness.commercialName.trim() === '') {
      this.showErrorToast('El nombre comercial es obligatorio');
      return;
    }

    const updateData: UpdateBusinessRequest = {};
    
    if (this.editableBusiness.commercialName !== undefined) {
      updateData.commercialName = this.editableBusiness.commercialName.trim();
    }
    
    if (this.editableBusiness.description !== undefined) {
      updateData.description = this.editableBusiness.description ? this.editableBusiness.description.trim() : '';
    }

    if (this.editableBusiness.facebook !== undefined && this.editableBusiness.facebook !== null) {
      updateData.facebook = this.editableBusiness.facebook.trim();
    }
    
    if (this.editableBusiness.instagram !== undefined && this.editableBusiness.instagram !== null) {
      updateData.instagram = this.editableBusiness.instagram.trim();
    }
    
    if (this.editableBusiness.tiktok !== undefined && this.editableBusiness.tiktok !== null) {
      updateData.tiktok = this.editableBusiness.tiktok.trim();
    }
    
    if (this.editableBusiness.website !== undefined && this.editableBusiness.website !== null) {
      updateData.website = this.editableBusiness.website.trim();
    }
    
    if (this.editableBusiness.email !== undefined && this.editableBusiness.email !== null) {
      updateData.email = this.editableBusiness.email.trim();
    }
    
    if (this.editableBusiness.whatsappNumber !== undefined && this.editableBusiness.whatsappNumber !== null) {
      updateData.whatsappNumber = this.editableBusiness.whatsappNumber.trim();
    }
    
    if (this.editableBusiness.address !== undefined && this.editableBusiness.address !== null) {
      updateData.address = this.editableBusiness.address.trim();
    }

    if (this.editableBusiness.acceptsWhatsappOrders !== undefined) {
      updateData.acceptsWhatsappOrders = Boolean(this.editableBusiness.acceptsWhatsappOrders);
    }

    if (this.editableBusiness.googleMapsCoordinates !== undefined && 
        this.editableBusiness.googleMapsCoordinates !== this.business.googleMapsCoordinates) {
      updateData.googleMapsCoordinates = this.editableBusiness.googleMapsCoordinates;
    }

    console.log('=== FINAL UPDATE DATA ===');
    console.log('Update payload:', JSON.stringify(updateData, null, 2));

    if (Object.keys(updateData).length === 0) {
      this.showInfoToast('No hay cambios para guardar');
      this.closeAdminModal();
      return;
    }

    try {
      this.loading = true;
      
      console.log('Calling updateBusiness with:', {
        businessId: this.businessId,
        updateData: updateData
      });

      const response = await this.detallePrivadoService.updateBusiness(
        this.businessId, 
        updateData, 
        this.business?.validationStatus
      ).toPromise();
      
      console.log('Update response:', response);
      
      if (this.business) {
        Object.assign(this.business, updateData);
        console.log('Updated local business:', this.business);
      }
      
      this.showSuccessToast('Negocio actualizado exitosamente');
      this.closeAdminModal();

      if (this.business.validationStatus === 'REJECTED') {
        setTimeout(() => {
          this.showInfoToast('Tu negocio se ha actualizado. Será revisado nuevamente para validación.');
        }, 1000);
      }
      
    } catch (error: any) {
      console.error('=== ERROR UPDATING BUSINESS ===');
      console.error('Full error object:', error);
      console.error('Error status:', error.status);
      console.error('Error message:', error.message);
      console.error('Error body:', error.error);
      
      let errorMessage = 'Error al actualizar el negocio';
      
      if (error.status === 400) {
        errorMessage = 'Datos inválidos. Verifica que todos los campos estén correctos.';
      } else if (error.status === 401) {
        errorMessage = 'No tienes autorización. Por favor, inicia sesión nuevamente.';
        this.authService.logout();
      } else if (error.status === 403) {
        errorMessage = 'No tienes permisos para editar este negocio.';
      } else if (error.status === 404) {
        errorMessage = 'El negocio no fue encontrado.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      this.showErrorToast(errorMessage);
    } finally {
      this.loading = false;
    }
  }

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