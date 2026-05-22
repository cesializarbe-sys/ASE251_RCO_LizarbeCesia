import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { DashboardService } from '../dashboard/services/dashboard.service';
import { Cosecha } from '../../core/models/cosecha.model';
import { Campo } from '../../core/models/campo.model';
import { Cultivo } from '../../core/models/cultivo.model';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-produccion',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './produccion.component.html'
})
export class ProduccionComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private apiUrl = environment.apiUrl;
  ds = inject(DashboardService);

  showChart = signal(true);
  showModal = signal(false);
  showDeleteConfirm = signal(false);
  isLoading = signal(false);
  editingCosecha = signal<Cosecha | null>(null);
  deletingCosecha = signal<Cosecha | null>(null);

  cosechas = signal<Cosecha[]>([]);
  campos = signal<Campo[]>([]);
  cultivos = signal<Cultivo[]>([]);

  selectedCampoId = signal<number | undefined>(undefined);

  tiposCultivo = ['MANDARINA', 'PALTA', 'ARANDANO', 'CAQUI', 'UVA'];

  form: {
    fecha: string; tipoCultivo: string; idCultivoSelected?: number;
    cantidadKg?: number; cantidadUnidades?: number; observaciones?: string;
  } = { fecha: '', tipoCultivo: 'MANDARINA' };

  /** Cultivos filtrados por el campo seleccionado */
  filteredCultivos = computed(() => {
    const campoId = this.selectedCampoId();
    if (!campoId) return this.cultivos();
    return this.cultivos().filter(c => c.campo?.idCampo === Number(campoId));
  });

  chartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: true, position: 'bottom', labels: { usePointStyle: true, padding: 20, font: { family: 'Inter', size: 12 } } } },
    scales: {
      y: { beginAtZero: true, ticks: { callback: (v) => v + ' kg', font: { family: 'Inter', size: 11 } }, grid: { color: '#F3F4F6' } },
      x: { ticks: { font: { family: 'Inter', size: 11 } }, grid: { display: false } }
    }
  };

  ngOnInit() { this.ds.loadData(); this.loadCosechas(); this.loadCampos(); this.loadCultivos(); }

  loadCosechas(): void {
    this.http.get<Cosecha[]>(`${this.apiUrl}/cosechas`).subscribe({
      next: (data) => this.cosechas.set(data),
      error: () => this.toast.error('Error al cargar cosechas')
    });
  }

  loadCampos(): void {
    this.http.get<Campo[]>(`${this.apiUrl}/campos/estado/true`).subscribe({
      next: (data) => this.campos.set(data),
      error: () => this.toast.error('Error al cargar campos')
    });
  }

  loadCultivos(): void {
    this.http.get<Cultivo[]>(`${this.apiUrl}/cultivos/estado/true`).subscribe({
      next: (data) => this.cultivos.set(data),
      error: () => this.cultivos.set([])
    });
  }

  private backendDateToInput(dateStr?: string): string {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    const parts = dateStr.split('/');
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return dateStr;
  }

  private inputDateToBackend(dateStr: string): string {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  onCampoChange(campoId: number | undefined): void {
    this.selectedCampoId.set(campoId ? Number(campoId) : undefined);
    const filtered = this.filteredCultivos();
    // Auto-select if only one cultivo in that campo
    this.form.idCultivoSelected = filtered.length === 1 ? filtered[0].idCultivo : undefined;
  }

  openCreate(): void {
    this.editingCosecha.set(null);
    this.selectedCampoId.set(undefined);
    this.form = { fecha: new Date().toISOString().split('T')[0], tipoCultivo: 'MANDARINA', idCultivoSelected: undefined, cantidadKg: undefined, cantidadUnidades: undefined, observaciones: '' };
    this.showModal.set(true);
  }

  openEdit(cosecha: Cosecha): void {
    this.editingCosecha.set(cosecha);
    this.selectedCampoId.set(cosecha.campo?.idCampo);
    this.form = {
      fecha: this.backendDateToInput(cosecha.fecha),
      tipoCultivo: cosecha.tipoCultivo,
      idCultivoSelected: cosecha.cultivo?.idCultivo,
      cantidadKg: cosecha.cantidadKg,
      cantidadUnidades: cosecha.cantidadUnidades,
      observaciones: cosecha.observaciones
    };
    this.showModal.set(true);
  }

  saveForm(): void {
    const campoId = this.selectedCampoId();
    if (!this.form.tipoCultivo || !campoId || !this.form.fecha) {
      this.toast.warning('Complete los campos obligatorios');
      return;
    }
    if (!this.form.idCultivoSelected) {
      this.toast.warning('Seleccione un cultivo');
      return;
    }
    this.isLoading.set(true);
    const userId = this.authService.currentUser()?.idUsuario;
    const payload = {
      fecha: this.inputDateToBackend(this.form.fecha),
      campo: { idCampo: Number(campoId) },
      cultivo: { idCultivo: Number(this.form.idCultivoSelected) },
      usuario: { idUsuario: userId },
      tipoCultivo: this.form.tipoCultivo,
      cantidadKg: this.form.cantidadKg ?? 0,
      cantidadUnidades: this.form.cantidadUnidades ?? 0,
      observaciones: this.form.observaciones
    };
    const editing = this.editingCosecha();
    const req$ = editing?.idCosecha
      ? this.http.put<Cosecha>(`${this.apiUrl}/cosechas/${editing.idCosecha}`, payload)
      : this.http.post<Cosecha>(`${this.apiUrl}/cosechas`, payload);
    req$.subscribe({
      next: () => { this.isLoading.set(false); this.showModal.set(false); this.loadCosechas(); this.ds.loadData(); this.toast.success(editing ? 'Cosecha actualizada' : 'Cosecha registrada'); },
      error: (err) => { this.isLoading.set(false); this.toast.error(err.error?.message || 'Error al guardar la cosecha'); }
    });
  }

  confirmDelete(cosecha: Cosecha): void { this.deletingCosecha.set(cosecha); this.showDeleteConfirm.set(true); }

  executeDelete(): void {
    const item = this.deletingCosecha();
    if (!item?.idCosecha) return;
    this.http.patch<Cosecha>(`${this.apiUrl}/cosechas/${item.idCosecha}/eliminar`, {}).subscribe({
      next: () => { this.showDeleteConfirm.set(false); this.deletingCosecha.set(null); this.loadCosechas(); this.ds.loadData(); this.toast.success('Cosecha eliminada'); },
      error: () => { this.showDeleteConfirm.set(false); this.toast.error('Error al eliminar'); }
    });
  }

  restoreCosecha(cosecha: Cosecha): void {
    if (!cosecha.idCosecha) return;
    this.http.patch<Cosecha>(`${this.apiUrl}/cosechas/${cosecha.idCosecha}/restaurar`, {}).subscribe({
      next: () => { this.loadCosechas(); this.ds.loadData(); this.toast.success('Cosecha restaurada'); },
      error: () => this.toast.error('Error al restaurar')
    });
  }

  getCampoNombre(cosecha: Cosecha): string { return cosecha.campo?.nombre ?? '—'; }
  getCultivoNombre(cosecha: Cosecha): string { return cosecha.cultivo?.nombre ?? '—'; }
}
