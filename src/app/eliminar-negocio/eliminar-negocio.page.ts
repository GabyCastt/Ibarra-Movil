import { Component, Input } from '@angular/core';
import { ModalController, AlertController, ToastController } from '@ionic/angular';
import { NegocioService } from '../services/negocio.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
  IonContent, IonItem, IonInput, IonRadioGroup, IonRadio, IonTextarea, 
  IonSpinner
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-eliminar-negocio',
  templateUrl: './eliminar-negocio.page.html',
  styleUrls: ['./eliminar-negocio.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonButtons,
    IonButton, IonIcon, IonContent, IonItem, IonInput, IonRadioGroup, 
    IonRadio, IonTextarea, IonSpinner
  ]
})
export class EliminarNegocioPage {
  @Input() businessId: number = 0;
  @Input() businessName: string = '';

  // Variables para crear solicitud
  motivo: string = '';
  justificacion: string = '';
  loading: boolean = false;

  motivos = [
  { value: 'CIERRE_DEFINITIVO_NEGOCIO', label: 'Cierre definitivo del negocio' },
  { value: 'CAMBIO_MODELO_NEGOCIO', label: 'Cambio de modelo de negocio' },
  { value: 'DIFICULTADES_FINANCIERAS', label: 'Dificultades financieras' },
  { value: 'REUBICACION', label: 'Reubicación o mudanza' },
  { value: 'MOTIVOS_PERSONALES', label: 'Motivos personales/familiares' },
  { value: 'CAMBIO_CARRERA', label: 'Cambio de carrera profesional' },
  { value: 'CONDICIONES_MERCADO', label: 'Condiciones desfavorables del mercado' },
  { value: 'PROBLEMAS_SALUD', label: 'Problemas de salud' },
  { value: 'DISOLUCION_SOCIEDAD', label: 'Disolución de sociedad' },
  { value: 'JUBILACION', label: 'Jubilación o retiro' },
  { value: 'PROBLEMAS_LEGALES', label: 'Problemas de cumplimiento legal' },
  { value: 'OTRO', label: 'Otro motivo' }
];

  constructor(
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private negocioService: NegocioService
  ) {}

  get isFormValid(): boolean {
    return !!this.businessId && !!this.motivo && !!this.justificacion?.trim();
  }

  // Confirmar eliminación
  async confirmDeletion() {
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

  private async sendDeletionRequest() {
    this.loading = true;
    try {
      const response = await this.negocioService.requestBusinessDeletion(
        this.businessId, this.motivo, this.justificacion
      ).toPromise();

      await this.showToast('Solicitud enviada correctamente', 'success');
      this.modalCtrl.dismiss(true);
    } catch (error: any) {
      await this.showToast(error.message || 'Error al enviar solicitud', 'danger');
    } finally {
      this.loading = false;
    }
  }

  getMotivoLabel(motivoValue: string): string {
    const motivo = this.motivos.find(m => m.value === motivoValue);
    return motivo ? motivo.label : motivoValue;
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message, duration: 3000, color, position: 'bottom'
    });
    await toast.present();
  }

  closeModal(data?: any) {
    this.modalCtrl.dismiss(data);
  }
}