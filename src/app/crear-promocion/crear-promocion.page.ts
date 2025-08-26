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

  nuevaPromocion: any = {
    tipoPromocion: 'DESCUENTO_PORCENTAJE',
    tituloPromocion: '',
    fechaPromoInicio: new Date().toISOString().split('T')[0],
    fechaPromoFin: '',
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

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validar tamaño máximo (2MB)
      if (file.size > 2 * 1024 * 1024) {
        this.mostrarAlerta('Error', 'La imagen no debe superar los 2MB');
        event.target.value = '';
        return;
      }

      // Validar tipo de archivo
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

    // Valida que la fecha fin sea posterior a la fecha inicio
    if (
      new Date(this.nuevaPromocion.fechaPromoFin) <=
      new Date(this.nuevaPromocion.fechaPromoInicio)
    ) {
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
