import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-mis-datos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mis-datos.component.html'
})
export class MisDatosComponent {
  auth = inject(AuthService);

  tabs = ['Información Personal', 'Certificaciones'];
  activeTab = signal('Información Personal');

  rolLabel = computed(() =>
    this.auth.userRole() === 'ADMINISTRADOR' ? 'Administrador General' : 'Encargado de Campo'
  );

  rolBadgeClass = computed(() =>
    this.auth.userRole() === 'ADMINISTRADOR' ? 'badge-info' : 'badge-success'
  );

  getInitials(): string {
    return this.auth.userName().split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  }
}
