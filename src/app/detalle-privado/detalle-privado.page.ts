import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { DetallePrivadoService, Business } from '../services/detalle-privado.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-detalle-privado',
  templateUrl: './detalle-privado.page.html',
  styleUrls: ['./detalle-privado.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
})
export class DetallePrivadoPage implements OnInit {
  businesses: Business[] = [];
  categories: any[] = [];
  selectedCategory: string = '';
  isLoading: boolean = false;
  currentPage: number = 0;
  pageSize: number = 10;
  hasMoreData: boolean = true;

  constructor(
    private detallePrivadoService: DetallePrivadoService,
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
      const categories = await this.detallePrivadoService.getCategories().toPromise();
      this.categories = Array.isArray(categories) ? categories : [];
      
      await this.loadBusinesses(true);
    } catch (error) {
      console.error('Error loading initial data:', error);
      if (error instanceof Error && error.message === 'No authentication token available') {
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
      const response = await this.detallePrivadoService
        .getPrivateBusinesses(this.selectedCategory, this.currentPage, this.pageSize)
        .toPromise();

      if (response && response.success && response.data && Array.isArray(response.data.content)) {
        const newBusinesses = response.data.content;

        this.businesses = reset
          ? newBusinesses
          : [...this.businesses, ...newBusinesses];

        this.hasMoreData = this.currentPage < (response.data.totalPages - 1);
        if (this.hasMoreData) this.currentPage++;
      } else {
        console.warn('Unexpected response format:', response);
      }
    } catch (error) {
      console.error('Error loading businesses:', error);
      if (error instanceof Error && error.message.includes('autenticado')) {
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

  trackByBusinessId(index: number, business: Business): number {
    return business.id;
  }

  getCategoryName(categoryId: string): string {
    if (!categoryId || !this.categories || !Array.isArray(this.categories)) return '';
    const category = this.categories.find((cat) => cat?.id === categoryId);
    return category?.name || '';
  }

  viewBusinessDetails(businessId: number) {
    this.router.navigate(['/detalle-negocio', businessId]);
  }

  openSocial(url: string, platform: string) {
    let socialUrl = url;
    if (!url.startsWith('http')) {
      socialUrl = `https://${platform}.com/${url}`;
    }
    window.open(socialUrl, '_blank');
  }
}