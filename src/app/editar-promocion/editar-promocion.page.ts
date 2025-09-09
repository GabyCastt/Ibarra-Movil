import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonLabel,
  IonButtons,
  IonItem,
  IonText,
  IonNote,
  IonSpinner,
  ModalController,
  AlertController,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close, camera } from 'ionicons/icons';

@Component({
  selector: 'app-editar-promocion',
  templateUrl: './editar-promocion.page.html',
  styleUrls: ['./editar-promocion.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonLabel,
    IonButtons,
    IonItem,
    IonText,
    IonNote,
    IonSpinner,
    IonIcon,
  ],
})
export class EditarPromocionPage {
  @Input() promocion!: any;

  promocionEditada: any = {};
  selectedFile: File | null = null;
  currentImageUrl: string = '';
  isSubmitting = false;

  hoy: string = this.getFechaHoyEcuador(); // Fecha mínima en Ecuador

  tiposPromocion = [
    { value: 'DESCUENTO_PORCENTAJE', label: 'Descuento Porcentaje' },
    { value: 'DOSXUNO', label: 'Dos por Uno' },
    { value: 'DESCUENTO_FIJO', label: 'Descuento Fijo' },
    { value: 'COMBO', label: 'Combo' },
  ];

  constructor(
    private modalCtrl: ModalController,
    private alertController: AlertController
  ) {
    addIcons({ close, camera });
  }

  private parseDateForDisplay(dateString: string): string {
    if (!dateString) return dateString;
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }

  ngOnInit() {
    this.promocionEditada = {
      ...this.promocion,
      fechaPromoInicio: this.parseDateForDisplay(
        this.promocion.fechaPromoInicio
      ),
      fechaPromoFin: this.parseDateForDisplay(this.promocion.fechaPromoFin),
      bussinessId: this.promocion.businessId,
    };
    this.currentImageUrl = this.promocion.businessImageUrl || '';
  }

  getFechaHoyEcuador(): string {
    const ahora = new Date();
    const ecuadorOffset = -5 * 60; // UTC-5
    const fechaUtc = new Date(
      ahora.getTime() + ahora.getTimezoneOffset() * 60000
    );
    const fechaEcuador = new Date(fechaUtc.getTime() + ecuadorOffset * 60000);

    const year = fechaEcuador.getFullYear();
    const month = (fechaEcuador.getMonth() + 1).toString().padStart(2, '0');
    const day = fechaEcuador.getDate().toString().padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        this.mostrarAlerta('Error', 'La imagen no debe superar los 2MB');
        event.target.value = '';
        return;
      }

      const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        this.mostrarAlerta('Error', 'Solo se permiten imágenes JPG o PNG');
        event.target.value = '';
        return;
      }

      this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.currentImageUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  async mostrarAlerta(titulo: string, mensaje: string) {
    const alert = await this.alertController.create({
      header: titulo,
      message: mensaje,
      buttons: ['OK'],
    });
    await alert.present();
  }

  cancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  confirm() {
    if (
      !this.promocionEditada.tituloPromocion ||
      !this.promocionEditada.fechaPromoInicio ||
      !this.promocionEditada.fechaPromoFin ||
      !this.promocionEditada.condiciones
    ) {
      this.mostrarAlerta('Error', 'Todos los campos son obligatorios');
      return;
    }

    // Valida que la fecha inicio no sea menor a hoy
    if (this.promocionEditada.fechaPromoInicio < this.hoy) {
      this.mostrarAlerta(
        'Error',
        'La fecha de inicio no puede ser en el pasado'
      );
      return;
    }

    // Valida que la fecha fin sea posterior a la fecha inicio
    if (
      this.promocionEditada.fechaPromoFin <=
      this.promocionEditada.fechaPromoInicio
    ) {
      this.mostrarAlerta(
        'Error',
        'La fecha de fin debe ser posterior a la fecha de inicio'
      );
      return;
    }

    const promocionCompleta = {
      ...this.promocionEditada,
      businessId: this.promocion.businessId,
    };

    this.modalCtrl.dismiss(
      {
        promocion: promocionCompleta,
        archivo: this.selectedFile,
      },
      'confirm'
    );
  }
}
