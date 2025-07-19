import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

@Injectable({
  providedIn: 'root' 
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    // Verifica si hay un token JWT almacenado
    const token = localStorage.getItem('jwt_token');
    
    if (token) {
      return true; // Permite el acceso a la ruta protegida
    } else {
      // Guarda la URL a la que intentaba acceder para redirigir después del login
      localStorage.setItem('pending_route', state.url);
      
      // Redirige al login
      this.router.navigate(['/login']);
      return false; // Bloquea el acceso
    }
  }
}