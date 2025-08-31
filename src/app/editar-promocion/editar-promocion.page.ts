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

  ngOnInit() {
    // Copiar los datos de la promoción para editar
    this.promocionEditada = { ...this.promocion,
      bussinessId: this.promocion.businessId
     };
    this.currentImageUrl = this.promocion.businessImageUrl || '';
  }

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
      
      // Mostrar vista previa de la nueva imagen
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

// En editar-promocion.page.ts - modifica el método confirm()
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

  // Valida que la fecha fin sea posterior a la fecha inicio
  if (
    new Date(this.promocionEditada.fechaPromoFin) <=
    new Date(this.promocionEditada.fechaPromoInicio)
  ) {
    this.mostrarAlerta(
      'Error',
      'La fecha de fin debe ser posterior a la fecha de inicio'
    );
    return;
  }

  // Asegúrate de incluir el businessId en el DTO
  const promocionCompleta = {
    ...this.promocionEditada,
    businessId: this.promocion.businessId // Añade el businessId
  };

  this.modalCtrl.dismiss(
    {
      promocion: promocionCompleta, // Usa el objeto completo
      archivo: this.selectedFile,
    },
    'confirm'
  );
}
}