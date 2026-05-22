import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../services/dashboard.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../shared/services/notification.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  dashboardService = inject(DashboardService);
  authService = inject(AuthService);
  notifService = inject(NotificationService);

  actividadIconMap: Record<string, string> = {
    RIEGO: 'water_drop', PODA: 'content_cut', FUMIGACION: 'science',
    FERTILIZACION: 'eco', OTRO: 'handyman'
  };
  actividadColorMap: Record<string, string> = {
    RIEGO: 'bg-blue-500', PODA: 'bg-green-500', FUMIGACION: 'bg-purple-500',
    FERTILIZACION: 'bg-amber-500', OTRO: 'bg-gray-500'
  };

  ngOnInit(): void {
    this.dashboardService.loadData();
  }

  getActIcon(tipo: string): string { return this.actividadIconMap[tipo] ?? 'handyman'; }
  getActColor(tipo: string): string { return this.actividadColorMap[tipo] ?? 'bg-gray-500'; }

  formatFecha(fecha: string): string {
    if (!fecha) return '';
    try {
      const d = new Date(fecha);
      if (isNaN(d.getTime())) return fecha;
      const now = new Date();
      const diff = now.getTime() - d.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      if (days === 0) return 'Hoy';
      if (days === 1) return 'Ayer';
      if (days < 7) return `Hace ${days} días`;
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    } catch { return fecha; }
  }
}
