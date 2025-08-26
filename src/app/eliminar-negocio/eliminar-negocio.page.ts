import { Component, Input } from '@angular/core';
import { ModalController, AlertController, ToastController } from '@ionic/angular';
import { NegocioService } from '../services/negocio.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
  IonContent, IonCard, IonCardContent, IonCardHeader, IonCardTitle,
  IonItem, IonLabel, IonInput, IonChip, IonRadioGroup, IonList, 
  IonRadio, IonTextarea, IonNote, IonSelect, IonSelectOption, 
  IonSpinner, IonBadge, IonRefresher, IonRefresherContent, 
  IonSearchbar, IonSegment, IonSegmentButton, IonInfiniteScroll, 
  IonInfiniteScrollContent
} from '@ionic/angular/standalone';

export interface DeletionRequest {
  id: number;
  businessName: string;
  motivo: string;
  justificacion: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedBy: string;
  createdAt?: string;
}

@Component({
  selector: 'app-eliminar-negocio',
  templateUrl: './eliminar-negocio.page.html',
  styleUrls: ['./eliminar-negocio.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonButtons,
    IonButton, IonIcon, IonContent, IonCard, IonCardContent, IonCardHeader,
    IonCardTitle, IonItem, IonLabel, IonInput, IonChip, IonRadioGroup, 
    IonList, IonRadio, IonTextarea, IonNote, IonSelect, IonSelectOption, 
    IonSpinner, IonBadge, IonRefresher, IonRefresherContent, IonSearchbar, 
    IonSegment, IonSegmentButton, IonInfiniteScroll, IonInfiniteScrollContent
  ]
})
export class EliminarNegocioPage {
  @Input() businessId: number = 0;
  @Input() businessName: string = '';
  @Input() viewMode: 'create' | 'list' = 'create';

  // Variables para crear solicitud
  motivo: string = '';
  justificacion: string = '';
  loading: boolean = false;

  // Variables para listar solicitudes
  deletionRequests: DeletionRequest[] = [];
  filteredRequests: DeletionRequest[] = [];
  selectedStatus: 'PENDING' | 'APPROVED' | 'REJECTED' = 'PENDING';
  searchTerm: string = '';
  loadingRequests: boolean = false;

  motivos = [
    { value: 'REPORTED_INACTIVE', label: 'Negocio reportado como inactivo' },
    { value: 'VIOLATION_TERMS', label: 'Violación de términos' },
    { value: 'DUPLICATE_RECORD', label: 'Registro duplicado' },
    { value: 'OWNER_REQUEST', label: 'Solicitud del propietario' },
    { value: 'QUALITY_ISSUE', label: 'No cumple estándares' },
    { value: 'OTHER', label: 'Otro motivo' }
  ];

  constructor(
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private negocioService: NegocioService
  ) {}

  ngOnInit() {
    console.log('EliminarNegocioPage initialized with viewMode:', this.viewMode);
    console.log('BusinessId:', this.businessId, 'BusinessName:', this.businessName);
    
    if (this.viewMode === 'list') {
      this.loadDeletionRequests();
    }
  }

  get isFormValid(): boolean {
    // Validar que tenemos businessId y los campos requeridos
    return !!this.businessId && !!this.motivo && !!this.justificacion?.trim();
  }

  get statusCounts() {
    const counts = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
    this.deletionRequests.forEach(request => {
      counts[request.status]++;
    });
    return counts;
  }

  // Métodos para crear solicitud de eliminación
  async confirmDeletion() {
    // Validar que tenemos todos los datos necesarios
    if (!this.businessId) {
      await this.showToast('Error: No se ha seleccionado un negocio válido', 'danger');
      return;
    }

    if (!this.businessName) {
      await this.showToast('Error: Nombre del negocio no disponible', 'danger');
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Confirmar Eliminación',
      message: `¿Enviar solicitud de eliminación para "${this.businessName}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Confirmar', handler: () => this.sendDeletionRequest() }
      ]
    });
    await alert.present();
  }

trackByRequestId(index: number, request: DeletionRequest): number {
    return request.id;
  }





  private async sendDeletionRequest() {
    this.loading = true;
    try {
      console.log('Enviando solicitud de eliminación:', {
        businessId: this.businessId,
        motivo: this.motivo,
        justificacion: this.justificacion
      });

      const response = await this.negocioService.requestBusinessDeletion(
        this.businessId, 
        this.motivo, 
        this.justificacion
      ).toPromise();
      
      console.log('Respuesta exitosa:', response);
      await this.showToast('Solicitud enviada correctamente', 'success');
      this.modalCtrl.dismiss(true);
    } catch (error: any) {
      console.error('Error al enviar solicitud:', error);
      await this.showToast(error.message || 'Error al enviar solicitud', 'danger');
    } finally {
      this.loading = false;
    }
  }

  // Métodos para listar y filtrar solicitudes
  async loadDeletionRequests() {
    this.loadingRequests = true;
    try {
      console.log('Cargando solicitudes con estado:', this.selectedStatus);
      this.deletionRequests = await this.negocioService.getDeletionRequests(this.selectedStatus).toPromise();
      console.log('Solicitudes cargadas:', this.deletionRequests);
      this.applyFilters();
    } catch (error: any) {
      console.error('Error al cargar solicitudes:', error);
      await this.showToast('Error al cargar solicitudes', 'danger');
    } finally {
      this.loadingRequests = false;
    }
  }

  onStatusChange(event: any) {
    this.selectedStatus = event.detail.value;
    this.loadDeletionRequests();
  }

  onSearchChange(event: any) {
    this.searchTerm = event.detail.value;
    this.applyFilters();
  }

  applyFilters() {
    this.filteredRequests = this.deletionRequests.filter(request => {
      const matchesSearch = !this.searchTerm || 
        request.businessName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        request.requestedBy.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        request.justificacion.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  }

  async doRefresh(event: any) {
    try {
      if (this.viewMode === 'list') {
        await this.loadDeletionRequests();
      }
    } finally {
      event.target.complete();
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'danger';
      default: return 'medium';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'PENDING': return 'Pendiente';
      case 'APPROVED': return 'Aprobado';
      case 'REJECTED': return 'Rechazado';
      default: return status;
    }
  }

  getMotivoLabel(motivoValue: string): string {
    const motivo = this.motivos.find(m => m.value === motivoValue);
    return motivo ? motivo.label : motivoValue;
  }

  async openPendingRequestsModal() {
    const modal = await this.modalCtrl.create({
      component: EliminarNegocioPage,
      componentProps: {
        viewMode: 'list'
      },
      cssClass: 'full-screen-modal'
    });

    await modal.present();
  }

  async viewRequestDetails(request: DeletionRequest) {
    const alert = await this.alertCtrl.create({
      header: 'Detalles de la Solicitud',
      message: `
        <strong>ID:</strong> ${request.id}<br>
        <strong>Negocio:</strong> ${request.businessName}<br>
        <strong>Motivo:</strong> ${this.getMotivoLabel(request.motivo)}<br>
        <strong>Justificación:</strong> ${request.justificacion}<br>
        <strong>Solicitado por:</strong> ${request.requestedBy}<br>
        <strong>Estado:</strong> ${this.getStatusLabel(request.status)}<br>
        ${request.createdAt ? `<strong>Fecha:</strong> ${new Date(request.createdAt).toLocaleDateString()}<br>` : ''}
      `,
      buttons: ['OK']
    });
    await alert.present();
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message, 
      duration: 3000, 
      color, 
      position: 'bottom'
    });
    await toast.present();
  }

  closeModal(data?: any) {
    this.modalCtrl.dismiss(data);
  }
}