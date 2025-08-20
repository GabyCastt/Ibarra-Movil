import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DetallePublicoService, Business } from '../services/detalle-publico.service';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-detalle-publico',
  templateUrl: './detalle-publico.page.html',
  standalone: true,
  imports: [CommonModule, IonicModule],
  styleUrls: ['detalle-publico.page.scss']
})
export class DetallePublicoPage implements OnInit {
  @Input() businessId?: number;
  @Input() showModal: boolean = true;
  
  business: Business | null = null;
  currentImageIndex: number = 0;
  loading: boolean = false;
  error: string = '';
  formattedSchedules: { day: string, hours: string }[] = [];

  constructor(
    private businessService: DetallePublicoService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    console.log('=== DEBUGGING INICIO ===');
    
    // Obtener ID desde la ruta URL
    const routeId = this.route.snapshot.paramMap.get('id');
    console.log('Route ID:', routeId);
    console.log('Input businessId:', this.businessId);
    
    // Priorizar el ID de la ruta sobre el Input
    const finalBusinessId = routeId ? parseInt(routeId, 10) : this.businessId;
    console.log('Final business ID:', finalBusinessId);
    
    if (finalBusinessId) {
      this.businessId = finalBusinessId;
      console.log('Cargando negocio por ID...');
      this.loadBusinessDetails();
    } else {
      console.log('Cargando lista de negocios...');
      this.loadApprovedBusinesses();
    }
  }

  loadBusinessDetails(): void {
    if (!this.businessId) return;
    
    this.loading = true;
    this.error = '';
    
    // Usar el endpoint público específico que devuelve los datos directamente
    this.businessService.getBusinessByIdPublic(this.businessId).subscribe({
      next: (business: Business) => {
        console.log('Business loaded:', business);
        this.business = business;
        this.formattedSchedules = this.businessService.formatSchedules(business.schedules);
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading business details:', error);
        this.error = 'Error al cargar los detalles del negocio';
        this.loading = false;
        
        // Fallback: intentar cargar desde la lista de negocios aprobados
        this.loadApprovedBusinesses();
      }
    });
  }

  loadApprovedBusinesses(): void {
    this.loading = true;
    this.error = '';
    
    this.businessService.getApprovedBusinesses(0, 10).subscribe({
      next: (response) => {
        console.log('API Response:', response);
        
        if (response.success && response.data.content.length > 0) {
          if (this.businessId) {
            // Buscar el negocio específico por ID
            const foundBusiness = response.data.content.find(b => b.id === this.businessId);
            if (foundBusiness) {
              this.business = foundBusiness;
            } else {
              this.error = 'Negocio no encontrado';
              this.loading = false;
              return;
            }
          } else {
            // Tomar el primer negocio como ejemplo
            this.business = response.data.content[0];
          }
          
          if (this.business) {
            this.formattedSchedules = this.businessService.formatSchedules(this.business.schedules);
          }
        } else {
          this.error = 'No hay negocios disponibles';
        }
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading approved businesses:', error);
        this.error = 'Error al cargar los negocios';
        this.loading = false;
      }
    });
  }

  closeModal(): void {
    this.showModal = false;
    window.history.back();
  }

  saveDetails(): void {
    console.log('Guardando detalles del negocio:', this.business);
    this.closeModal();
  }

  // Métodos para el carrusel de imágenes
  nextImage(): void {
    if (this.business && this.business.photos.length > 0) {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.business.photos.length;
    }
  }

  prevImage(): void {
    if (this.business && this.business.photos.length > 0) {
      this.currentImageIndex = this.currentImageIndex === 0 
        ? this.business.photos.length - 1 
        : this.currentImageIndex - 1;
    }
  }

  selectImage(index: number): void {
    this.currentImageIndex = index;
  }

  // Métodos de utilidad
  openSocialMedia(platform: string): void {
    if (!this.business) return;

    let url = '';
    switch (platform) {
      case 'facebook':
        url = this.business.facebook && this.business.facebook.startsWith('http') 
          ? this.business.facebook 
          : `https://${this.business.facebook || ''}`;
        break;
      case 'instagram':
        url = this.business.instagram && this.business.instagram.startsWith('http') 
          ? this.business.instagram 
          : `https://${this.business.instagram || ''}`;
        break;
      case 'tiktok':
        url = this.business.tiktok && this.business.tiktok.startsWith('http') 
          ? this.business.tiktok 
          : `https://${this.business.tiktok || ''}`;
        break;
      case 'website':
        url = this.business.website || '';
        break;
    }

    if (url && url !== 'https://') {
      window.open(url, '_blank');
    }
  }

  openWhatsApp(): void {
    if (this.business?.whatsappNumber) {
      const cleanNumber = this.business.whatsappNumber.replace(/\D/g, '');
      const url = `https://wa.me/${cleanNumber}`;
      window.open(url, '_blank');
    }
  }

  openMaps(): void {
    if (this.business?.googleMapsCoordinates) {
      const coords = this.businessService.getCoordinatesArray(this.business.googleMapsCoordinates);
      const url = `https://www.google.com/maps?q=${coords[0]},${coords[1]}`;
      window.open(url, '_blank');
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

  // Getters para template
  get currentImage(): string {
    return this.business?.photos[this.currentImageIndex] || '';
  }

  get hasMultipleImages(): boolean {
    return this.business ? this.business.photos.length > 1 : false;
  }

  get deliveryText(): string {
    if (!this.business) return '';
    return this.business.deliveryService === 'SI' ? 'Servicio de delivery disponible' : 'Sin servicio de delivery';
  }

  get salePlaceText(): string {
    if (!this.business) return '';
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
}