import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Cosecha } from '../../../core/models/cosecha.model';
import { Campo } from '../../../core/models/campo.model';
import { AlertaFitosanitaria } from '../../../core/models/alerta-fitosanitaria.model';
import { ActividadCampo } from '../../../core/models/actividad-campo.model';
import { Usuario } from '../../../core/models/usuario.model';

export interface LoteProduccion {
  identificador: string;
  cultivo: string;
  superficieHa: number;
  rindeHa: number | null;
  produccionTotal: number | null;
  estado: 'COSECHADO' | 'EN_CURSO';
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  cosechas = signal<Cosecha[]>([]);
  campos = signal<Campo[]>([]);
  alertasPendientes = signal<AlertaFitosanitaria[]>([]);
  ultimasActividades = signal<ActividadCampo[]>([]);
  totalUsuarios = signal(0);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  // KPIs computados
  totalProducido = computed(() => {
    const total = this.cosechas().reduce((sum, c) => sum + (c.cantidadKg ?? 0), 0);
    return (total / 1000).toFixed(1);
  });

  rendimientoPromedio = computed(() => {
    const cosechasConDatos = this.cosechas().filter(c => c.cantidadKg && c.cantidadKg > 0);
    if (cosechasConDatos.length === 0) return '0.0';
    const camposActivos = this.campos().filter(c => c.estado);
    const totalHa = camposActivos.reduce((sum, c) => sum + c.hectareas, 0);
    if (totalHa === 0) return '0.0';
    const totalKg = cosechasConDatos.reduce((sum, c) => sum + (c.cantidadKg ?? 0), 0);
    return ((totalKg / 1000) / totalHa).toFixed(1);
  });

  lotesCosechados = computed(() =>
    this.cosechas().filter(c => c.cantidadKg && c.cantidadKg > 0).length
  );

  totalLotes = computed(() => this.campos().length);

  alertasPendientesCount = computed(() => this.alertasPendientes().length);

  // Últimas 5 cosechas para el feed del dashboard
  ultimasCosechas = computed(() =>
    [...this.cosechas()]
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 5)
  );

  // Datos para la tabla de producción
  lotesProduccion = computed<LoteProduccion[]>(() => {
    return this.campos().map(campo => {
      const cosechasCampo = this.cosechas().filter(
        c => c.campo?.idCampo === campo.idCampo
      );
      const totalKg = cosechasCampo.reduce((sum, c) => sum + (c.cantidadKg ?? 0), 0);
      const tieneCosecha = totalKg > 0;
      return {
        identificador: campo.nombre,
        cultivo: cosechasCampo[0]?.tipoCultivo ?? 'Sin cultivo',
        superficieHa: campo.hectareas,
        rindeHa: tieneCosecha ? parseFloat(((totalKg / 1000) / campo.hectareas).toFixed(1)) : null,
        produccionTotal: tieneCosecha ? parseFloat((totalKg / 1000).toFixed(1)) : null,
        estado: tieneCosecha ? 'COSECHADO' as const : 'EN_CURSO' as const
      };
    });
  });

  // Chart: producción real agrupada por campo
  chartData = computed(() => {
    const camposConCosecha = this.campos().slice(0, 6);
    const labels = camposConCosecha.map(c => c.nombre);
    const data = camposConCosecha.map(campo => {
      const kg = this.cosechas()
        .filter(c => c.campo?.idCampo === campo.idCampo)
        .reduce((sum, c) => sum + (c.cantidadKg ?? 0), 0);
      return parseFloat((kg / 1000).toFixed(1));
    });
    return {
      labels,
      datasets: [{
        label: 'Producción (t)',
        data,
        backgroundColor: labels.map((_, i) =>
          ['#2E7D32', '#1565C0', '#F57C00', '#D32F2F', '#7B1FA2', '#00838F'][i % 6]
        )
      }]
    };
  });

  loadData(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.http.get<Campo[]>(`${this.apiUrl}/campos/estado/true`).subscribe({
      next: (data) => this.campos.set(data),
      error: (err) => {
        console.error('[DashboardService] Error al cargar campos:', err);
        this.errorMessage.set('No se pudo conectar con el servidor. Verifique que el backend esté corriendo.');
        this.campos.set([]);
      }
    });

    this.http.get<Cosecha[]>(`${this.apiUrl}/cosechas`).subscribe({
      next: (data) => { this.cosechas.set(data); this.isLoading.set(false); },
      error: (err) => {
        console.error('[DashboardService] Error al cargar cosechas:', err);
        this.errorMessage.set('No se pudo conectar con el servidor. Verifique que el backend esté corriendo.');
        this.cosechas.set([]);
        this.isLoading.set(false);
      }
    });

    this.http.get<AlertaFitosanitaria[]>(`${this.apiUrl}/alertas/pendientes`).subscribe({
      next: (data) => this.alertasPendientes.set(data),
      error: () => this.alertasPendientes.set([])
    });

    // Cargar últimas actividades para el dashboard
    this.http.get<ActividadCampo[]>(`${this.apiUrl}/actividades-campo`).subscribe({
      next: (data) => this.ultimasActividades.set(
        [...data].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).slice(0, 5)
      ),
      error: () => this.ultimasActividades.set([])
    });

    // Cargar count de usuarios
    this.http.get<Usuario[]>(`${this.apiUrl}/usuarios`).subscribe({
      next: (data) => this.totalUsuarios.set(data.filter(u => u.estado !== false).length),
      error: () => this.totalUsuarios.set(0)
    });
  }
}
