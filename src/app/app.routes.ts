import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';


export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'registro-emprendimiento',
    loadComponent: () => import('./registro-emprendimiento/registro-emprendimiento.page').then( m => m.RegistroEmprendimientoPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'registro-app',
    loadComponent: () => import('./registro-app/registro-app.page').then( m => m.RegistroAppPage)
  },
  {
    path: 'perfil',
    loadComponent: () => import('./perfil/perfil.page').then( m => m.PerfilPage),
    canActivate: [AuthGuard]
  },
];
