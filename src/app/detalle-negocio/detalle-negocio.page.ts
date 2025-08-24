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
  showDeleteModal: boolean = false;
  showDeleteConfirmModal: boolean = false;

  editableBusiness: Partial<Business> = {};

  selectedDeleteReason: string = '';
  deleteReasons: string[] = [];
  deleteComment: string = '';

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
      this.deleteReasons = this.detallePrivadoService.getEliminationReasons();
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
      },
      error: (error: any) => {
        console.error('Error loading business details:', error);
        this.error = 'Error al cargar los detalles del negocio';
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
    console.log('Opening admin modal');
    this.editableBusiness = this.business ? { ...this.business } : {};
    this.showAdminModal = true;
  }

  closeAdminModal(): void {
    console.log('Closing admin modal');
    this.showAdminModal = false;
    this.editableBusiness = {};
  }

  async saveBusinessChanges(): Promise<void> {
    if (!this.business || !this.businessId) {
      console.error('Cannot save: business or businessId is missing');
      return;
    }

    console.log('Saving business changes...');
    const updateData: UpdateBusinessRequest = {};
    
    if (this.editableBusiness.commercialName !== undefined && 
        this.editableBusiness.commercialName !== this.business.commercialName) {
      updateData.commercialName = this.editableBusiness.commercialName;
    }
    if (this.editableBusiness.description !== undefined && 
        this.editableBusiness.description !== this.business.description) {
      updateData.description = this.editableBusiness.description;
    }
    if (this.editableBusiness.facebook !== undefined && 
        this.editableBusiness.facebook !== this.business.facebook) {
      updateData.facebook = this.editableBusiness.facebook;
    }
    if (this.editableBusiness.instagram !== undefined && 
        this.editableBusiness.instagram !== this.business.instagram) {
      updateData.instagram = this.editableBusiness.instagram;
    }
    if (this.editableBusiness.tiktok !== undefined && 
        this.editableBusiness.tiktok !== this.business.tiktok) {
      updateData.tiktok = this.editableBusiness.tiktok;
    }
    if (this.editableBusiness.website !== undefined && 
        this.editableBusiness.website !== this.business.website) {
      updateData.website = this.editableBusiness.website;
    }
    if (this.editableBusiness.email !== undefined && 
        this.editableBusiness.email !== this.business.email) {
      updateData.email = this.editableBusiness.email;
    }
    if (this.editableBusiness.acceptsWhatsappOrders !== undefined && 
        this.editableBusiness.acceptsWhatsappOrders !== this.business.acceptsWhatsappOrders) {
      updateData.acceptsWhatsappOrders = this.editableBusiness.acceptsWhatsappOrders;
    }
    if (this.editableBusiness.whatsappNumber !== undefined && 
        this.editableBusiness.whatsappNumber !== this.business.whatsappNumber) {
      updateData.whatsappNumber = this.editableBusiness.whatsappNumber;
    }
    if (this.editableBusiness.address !== undefined && 
        this.editableBusiness.address !== this.business.address) {
      updateData.address = this.editableBusiness.address;
    }
    if (this.editableBusiness.googleMapsCoordinates !== undefined && 
        this.editableBusiness.googleMapsCoordinates !== this.business.googleMapsCoordinates) {
      updateData.googleMapsCoordinates = this.editableBusiness.googleMapsCoordinates;
    }

    try {
      console.log('Update data:', updateData);
      await this.detallePrivadoService.updateBusiness(this.businessId, updateData).toPromise();
      
      if (this.business) {
        Object.assign(this.business, this.editableBusiness);
      }
      
      this.showSuccessToast('Negocio actualizado exitosamente');
      this.closeAdminModal();
    } catch (error) {
      console.error('Error updating business:', error);
      this.showErrorToast('Error al actualizar el negocio');
    }
  }

  openDeleteModal(): void {
    console.log('Opening delete modal');
    this.selectedDeleteReason = '';
    this.deleteComment = '';
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    console.log('Closing delete modal');
    this.showDeleteModal = false;
    this.selectedDeleteReason = '';
    this.deleteComment = '';
  }

  async requestDeletion(): Promise<void> {
    if (!this.selectedDeleteReason || this.selectedDeleteReason.trim() === '') {
      this.showErrorToast('Debe seleccionar un motivo');
      return;
    }

    console.log('Requesting deletion...');
    this.showDeleteConfirmModal = true;
  }

  async confirmDeletion(): Promise<void> {
    console.log('Confirming deletion:', {
      businessId: this.businessId,
      reason: this.selectedDeleteReason,
      comment: this.deleteComment
    });


    this.showSuccessToast('Solicitud de eliminación enviada');
    this.showDeleteConfirmModal = false;
    this.closeDeleteModal();
    
    this.router.navigate(['/mis-negocios']);
  }

  cancelDeletionConfirm(): void {
    console.log('Canceling deletion confirmation');
    this.showDeleteConfirmModal = false;
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
}