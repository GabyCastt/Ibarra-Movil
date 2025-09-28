import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-soporte',
  templateUrl: './soporte.page.html',
  styleUrls: ['./soporte.page.scss'],
  standalone: true,
  imports: [ CommonModule, FormsModule, IonicModule]
})
export class SoportePage {

  enviarCorreo(problema: string) {
    const destinatario = "soporte@tusistema.com"; // Debe ser cambiado por el gmail a usar el Municipio 
    const asunto = `Soporte - ${problema}`;
    const cuerpo = `Hola, estoy teniendo un problema relacionado con: ${problema}\n\nDetalles: `;

    const mailto = `mailto:${destinatario}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
    window.location.href = mailto;
  }
}
