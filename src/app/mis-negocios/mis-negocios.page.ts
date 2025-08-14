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
      // Carga en paralelo
      const [categories] = await Promise.all([
        this.negocioService.getCategories().toPromise(),
      ]);

      this.categories = categories || [];
      await this.loadBusinesses(true);
    } catch (error) {
      console.error('Error loading initial data:', error);
      if (error === 'No authentication token available') {
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

      if (response && Array.isArray(response.content)) {
        this.businesses = reset
          ? response.content
          : [...this.businesses, ...response.content];
        this.hasMoreData = !response.last;
        if (this.hasMoreData) this.currentPage++;
      } else {
        console.warn('Unexpected response format:', response);
      }
    } catch (error) {
      console.error('Error loading businesses:', error);
      if (
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof (error as any).message === 'string' &&
        (error as any).message.includes('sesión ha expirado')
      ) {
        this.authService.logout();
      }
    } finally {
      this.isLoading = false;
      if (event) event.target.complete();
    }
  }

  async onCategoryChange() {
    await this.loadBusinesses(true);
  }

  async loadMore(event: any) {
    await this.loadBusinesses(false, event);
  }

  trackByBusinessId(index: number, business: any): number {
    return business.id;
  }
  getCategoryName(categoryId: string): string {
    const category = this.categories.find((cat) => cat.id === categoryId);
    return category ? category.name : '';
  }

  editBusiness(businessId: string) {
    this.router.navigate(['/editar-negocio', businessId]);
  }
  // Abrir redes sociales
  openSocial(url: string, platform: string) {
    let socialUrl = url;
    if (!url.startsWith('http')) {
      socialUrl = `https://${platform}.com/${url}`;
    }
    window.open(socialUrl, '_blank');
  }

  // Navegar a detalles
  openDetails(businessId: string) {
    this.router.navigate(['/detalle-negocio', businessId]);
  }
}
