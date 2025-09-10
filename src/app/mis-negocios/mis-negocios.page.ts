import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, InfiniteScrollCustomEvent } from '@ionic/angular';
import { NegocioService } from '../services/negocio.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-mis-negocios',
  templateUrl: './mis-negocios.page.html',
  styleUrls: ['./mis-negocios.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
})
export class MisNegociosPage implements OnInit {
  businesses: any[] = [];
  categories: any[] = [];
  selectedCategory: string = '';
  isLoading: boolean = false;
  currentPage: number = 0;
  pageSize: number = 10;
  hasMoreData: boolean = true;

  constructor(
    private negocioService: NegocioService,
    private authService: AuthService,
    private router: Router
  ) {}

  async ngOnInit() {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    await this.loadInitialData();
  }

  async loadInitialData() {
    try {
      const [categories] = await Promise.all([
        this.negocioService.getCategories().toPromise(),
      ]);

      this.categories = Array.isArray(categories) ? categories : [];
      await this.loadBusinesses(true);
    } catch (error) {
      console.error('Error loading initial data:', error);
      if (
        error instanceof Error &&
        error.message === 'No authentication token available'
      ) {
        this.authService.logout();
      }
    }
  }

  async loadBusinesses(reset: boolean = false, event?: any) {
    if (this.isLoading) return;

    this.isLoading = true;

    if (reset) {
      this.currentPage = 0;
      this.businesses = [];
      this.hasMoreData = true;
    }

    try {
      const response = await this.negocioService
        .getBusinessesByUser(
          this.selectedCategory,
          this.currentPage,
          this.pageSize
        )
        .toPromise();

      if (response && response.content && Array.isArray(response.content)) {
        const newBusinesses = response.content;

        this.businesses = reset
          ? newBusinesses
          : [...this.businesses, ...newBusinesses];

        this.hasMoreData = this.currentPage < response.totalPages - 1;
        if (this.hasMoreData) this.currentPage++;
      } else {
        console.warn('Unexpected response format:', response);
      }
    } catch (error) {
      console.error('Error loading businesses:', error);
      if (
        error instanceof Error &&
        error.message.includes('sesión ha expirado')
      ) {
        this.authService.logout();
      }
    } finally {
      this.isLoading = false;
      if (event?.target?.complete) event.target.complete();
    }
  }

  async onCategoryChange() {
    await this.loadBusinesses(true);
  }

  async loadMore(event: any) {
    await this.loadBusinesses(false, event);
  }

  trackByBusinessId(index: number, business: any): number {
    return business?.id || index;
  }

  getCategoryName(categoryId: string): string {
    if (!categoryId || !this.categories || !Array.isArray(this.categories))
      return '';
    const category = this.categories.find((cat) => cat?.id === categoryId);
    return category?.name || '';
  }

  editBusiness(businessId: string | number) {
    if (businessId) {
      this.router.navigate(['/editar-negocio', businessId]);
    }
  }

  viewBusinessDetails(businessId: string | number) {
    if (businessId) {
      console.log('Navigating to business details with ID:', businessId);
      this.router.navigate(['/detalle-negocio', businessId]);
    } else {
      console.error('Business ID is null or undefined');
    }
  }

  openSocial(url: string, platform: string) {
    if (!url || !platform) return;

    let socialUrl = url;
    if (!url.startsWith('http')) {
      socialUrl = `https://${platform}.com/${url}`;
    }
    window.open(socialUrl, '_blank');
  }

  debugBusiness(business: any) {
    console.log('Business object:', business);
    console.log('Business ID:', business?.id);
    console.log('Business ID type:', typeof business?.id);
  }

  openDetails(businessId: string | number) {
    console.log('Opening details for business ID:', businessId);
    if (!businessId) {
      console.error('Cannot open details: Business ID is missing');
      return;
    }
    this.viewBusinessDetails(businessId);
  }
  getStatusColor(status: string): string {
    const statusMap: { [key: string]: string } = {
      VALIDATED: 'success',
      APPROVED: 'success',
      PENDING: 'warning',
      REJECTED: 'danger',
    };

    return statusMap[status?.toUpperCase()] || 'medium';
  }

  getStatusText(status: string): string {
    const statusTextMap: { [key: string]: string } = {
      VALIDATED: 'VALIDADO',
      APPROVED: 'APROBADO',
      PENDING: 'PENDIENTE',
      REJECTED: 'RECHAZADO',
    };

    return statusTextMap[status?.toUpperCase()] || status || 'DESCONOCIDO';
  }
}
