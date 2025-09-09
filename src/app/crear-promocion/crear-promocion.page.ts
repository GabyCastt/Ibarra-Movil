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
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-crear-promocion',
  templateUrl: './crear-promocion.page.html',
  styleUrls: ['./crear-promocion.page.scss'],
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
  ],
})
export class CrearPromocionPage {
  @Input() businessId!: number;

  hoy: string = this.getFechaHoyEcuador();

  nuevaPromocion: any = {
    tipoPromocion: 'DESCUENTO_PORCENTAJE',
    tituloPromocion: '',
    fechaPromoInicio: this.getFechaHoyEcuador(),
    fechaPromoFin: this.getFechaHoyEcuador(),
    condiciones: '',
  };

  selectedFile: File | null = null;
  isSubmitting = false;

  tiposPromocion = [
    { value: 'DESCUENTO_PORCENTAJE', label: 'Descuento Porcentaje' },
    { value: 'DOSXUNO', label: 'Dos por Uno' },
    { value: 'DESCUENTO_FIJO', label: 'Descuento Fijo' },
    { value: 'COMBO', label: 'Combo' },
  ];

  constructor(
    private modalCtrl: ModalController,
    private alertController: AlertController
  ) {}

  getFechaHoyEcuador(): string {
    const ahora = new Date();

    const ecuadorOffset = -5 * 60; // Ecuador UTC-5
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
    if (!this.selectedFile) {
      this.mostrarAlerta(
        'Error',
        'Debes seleccionar una imagen para la promoción'
      );
      return;
    }

    if (
      !this.nuevaPromocion.tituloPromocion ||
      !this.nuevaPromocion.fechaPromoInicio ||
      !this.nuevaPromocion.fechaPromoFin ||
      !this.nuevaPromocion.condiciones
    ) {
      this.mostrarAlerta('Error', 'Todos los campos son obligatorios');
      return;
    }

    const hoyStr = this.getFechaHoyEcuador();
    const inicioStr = this.nuevaPromocion.fechaPromoInicio;
    const finStr = this.nuevaPromocion.fechaPromoFin;

    if (inicioStr < hoyStr) {
      this.mostrarAlerta(
        'Error',
        'La fecha de inicio no puede ser en el pasado'
      );
      return;
    }

    if (finStr <= inicioStr) {
      this.mostrarAlerta(
        'Error',
        'La fecha de fin debe ser posterior a la fecha de inicio'
      );
      return;
    }

    const promocionData = {
      ...this.nuevaPromocion,
      businessId: this.businessId,
    };

    this.modalCtrl.dismiss(
      {
        promocion: promocionData,
        archivo: this.selectedFile,
      },
      'confirm'
    );
  }
}
