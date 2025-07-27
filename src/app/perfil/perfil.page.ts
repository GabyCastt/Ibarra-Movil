import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { IonicModule, AlertController, LoadingController } from '@ionic/angular';
import { PerfilService } from '../services/perfil.service';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, ReactiveFormsModule],
  providers: [PerfilService]
})
export class PerfilPage implements OnInit {
  profileForm!: FormGroup;
  isEditing = false;

  constructor(
    private fb: FormBuilder,
    private perfilService: PerfilService,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController
  ) {}

  ngOnInit() {
    this.initForm();
    this.loadProfile();
  }

  private initForm() {
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      lastname: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      address: [''],
      username: ['', Validators.required]
    });
  }

  private loadProfile() {
    // Obtener datos almacenados localmente
    const stored = localStorage.getItem('user_data');
    if (stored) {
      const data = JSON.parse(stored);
      this.profileForm.patchValue({
        name: data.name || '',
        lastname: data.lastname || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        username: data.username || ''
      });
    }

    // Si se requiere cargar datos desde el backend, descomentar lo siguiente
    // this.perfilService.getProfile().subscribe(resp => this.profileForm.patchValue(resp));
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.loadProfile();
    }
  }

  async saveProfile() {
    if (this.profileForm.invalid) {
      const alert = await this.alertCtrl.create({
        header: 'Datos inválidos',
        message: 'Revisa los campos marcados',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Guardando...',
      spinner: 'crescent'
    });
    await loading.present();

    const data = this.profileForm.value;

    // Enviar los datos al backend cuando el endpoint esté disponible
    // this.perfilService.updateProfile(data).subscribe({
    //   next: () => {
    //     loading.dismiss();
    //     this.isEditing = false;
    //   },
    //   error: () => {
    //     loading.dismiss();
    //   }
    // });

    console.log('Datos de perfil a guardar', data);
    loading.dismiss();
    this.isEditing = false;
  }
}
