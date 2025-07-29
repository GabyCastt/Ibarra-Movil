import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { IonicModule, AlertController, LoadingController } from '@ionic/angular';
import { PerfilService, UpdateUserDto } from '../services/perfil.service';

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
    this.initializeUserData(); // Inicializar datos si no existen
    this.loadProfile();
  }

  private initializeUserData() {
    // Si no hay datos en localStorage, crear datos iniciales
    const stored = localStorage.getItem('user_data');
    if (!stored) {
      const initialData = {
        name: '',
        lastname: '',
        email: 'calvachemaril@gmail.com',
        phone: '',
        address: '',
        business: '',
        username: 'calvachemaril'
      };
      localStorage.setItem('user_data', JSON.stringify(initialData));
    }
  }

  private initForm() {
    this.profileForm = this.fb.group({
      // Campos que se pueden actualizar en la API
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      address: [''],
      username: ['', Validators.required],
      
      // Campos de solo lectura (si los necesitas mostrar)
      name: [{ value: '', disabled: true }],
      lastname: [{ value: '', disabled: true }],
      business: [{ value: '', disabled: true }]
    });
  }

  private loadProfile() {
    // Obtener datos almacenados localmente primero
    const stored = localStorage.getItem('user_data');
    if (stored) {
      const data = JSON.parse(stored);
      this.profileForm.patchValue({
        name: data.name || '',
        lastname: data.lastname || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        business: data.business || '',
        username: data.username || ''
      });
    }

    // Cargar datos desde el backend usando /auth/whoami
    this.perfilService.getProfile().subscribe({
      next: (data) => {
        console.log('Profile data from server:', data);
        this.profileForm.patchValue(data);
        // Actualizar localStorage con datos del servidor
        localStorage.setItem('user_data', JSON.stringify(data));
      },
      error: (error) => {
        console.error('Error loading profile from /auth/whoami:', error);
        
        if (error.status === 401) {
          console.warn('Usuario no autenticado. Usando datos locales.');
        } else if (error.status === 403) {
          console.warn('Sin permisos para acceder al perfil. Usando datos locales.');
        } else {
          console.error('Error del servidor:', error.status);
        }
        
        // Si hay error, mantener los datos locales cargados anteriormente
      }
    });
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

    // Extraer solo los campos que acepta la API
    const formValue = this.profileForm.value;
    const updateData: UpdateUserDto = {
      email: formValue.email,
      phone: formValue.phone,
      address: formValue.address,
      username: formValue.username
    };

    this.perfilService.updateProfile(updateData).subscribe({
      next: (response) => {
        console.log('Profile updated successfully:', response);
        
        // Actualizar localStorage con los nuevos datos
        const currentData = JSON.parse(localStorage.getItem('user_data') || '{}');
        localStorage.setItem('user_data', JSON.stringify({
          ...currentData,
          ...updateData
        }));
        
        loading.dismiss();
        this.isEditing = false;
        
        this.showSuccessAlert();
      },
      error: async (error) => {
        console.error('Error updating profile:', error);
        loading.dismiss();
        
        let errorMessage = 'Error al guardar el perfil';
        
        if (error.status === 400) {
          errorMessage = 'Datos inválidos. Verifica la información ingresada.';
        } else if (error.status === 500) {
          errorMessage = 'Error interno del servidor. Intenta más tarde.';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        const alert = await this.alertCtrl.create({
          header: 'Error',
          message: errorMessage,
          buttons: ['OK']
        });
        await alert.present();
      }
    });
  }

  private async showSuccessAlert() {
    const alert = await this.alertCtrl.create({
      header: 'Éxito',
      message: 'Perfil actualizado correctamente',
      buttons: ['OK']
    });
    await alert.present();
  }
}