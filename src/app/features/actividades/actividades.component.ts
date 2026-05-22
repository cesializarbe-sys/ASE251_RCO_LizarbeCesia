import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ActividadCampo } from '../../core/models/actividad-campo.model';
import { Campo } from '../../core/models/campo.model';
import { Cultivo } from '../../core/models/cultivo.model';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-actividades',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './actividades.component.html'
})
export class ActividadesComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private apiUrl = environment.apiUrl;

  actividades = signal<ActividadCampo[]>([]);
  campos = signal<Campo[]>([]);
  cultivos = signal<Cultivo[]>([]);
  isLoading = signal(false);
  showModal = signal(false);
  showDeleteConfirm = signal(false);
  editingItem = signal<ActividadCampo | null>(null);
  deletingItem = signal<ActividadCampo | null>(null);

  isAdmin = computed(() => this.authService.userRole() === 'ADMINISTRADOR');
  selectedCampoId = signal<number | undefined>(undefined);

  form: {
    tipoActividad: string; fecha: string; idCultivo?: number; observaciones?: string;
  } = { tipoActividad: 'RIEGO', fecha: new Date().toISOString().split('T')[0] };

  tiposActividad = ['RIEGO', 'PODA', 'FUMIGACION', 'FERTILIZACION', 'OTRO'];

  actividadIconMap: Record<string, string> = { RIEGO: 'water_drop', PODA: 'content_cut', FUMIGACION: 'science', FERTILIZACION: 'eco', OTRO: 'handyman' };
  actividadColorMap: Record<string, string> = { RIEGO: 'bg-blue-100 text-blue-600', PODA: 'bg-green-100 text-green-600', FUMIGACION: 'bg-purple-100 text-purple-600', FERTILIZACION: 'bg-amber-100 text-amber-600', OTRO: 'bg-gray-100 text-gray-600' };

  filteredCultivos = computed(() => {
    const campoId = this.selectedCampoId();
    if (!campoId) return this.cultivos();
    return this.cultivos().filter(c => c.campo?.idCampo === Number(campoId));
  });

  ngOnInit(): void { this.loadActividades(); this.loadCampos(); this.loadCultivos(); }

  loadActividades(): void {
    this.isLoading.set(true);
    this.http.get<ActividadCampo[]>(`${this.apiUrl}/actividades-campo`).subscribe({
      next: (data) => {
        this.actividades.set([...data].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()));
        this.isLoading.set(false);
      },
      error: () => { this.toast.error('No se pudo conectar con el servidor.'); this.isLoading.set(false); }
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

  openCreate(): void {
    this.editingItem.set(null);
    this.selectedCampoId.set(undefined);
    this.form = { tipoActividad: 'RIEGO', fecha: new Date().toISOString().split('T')[0], idCultivo: undefined, observaciones: '' };
    this.showModal.set(true);
  }

  openEdit(item: ActividadCampo): void {
    this.editingItem.set(item);
    this.selectedCampoId.set(item.idCampo);
    this.form = { tipoActividad: item.tipoActividad, fecha: this.formatDateToInput(item.fecha), idCultivo: item.idCultivo, observaciones: item.observaciones };
    this.showModal.set(true);
  }

  onCampoChange(campoId: number | undefined): void {
    this.selectedCampoId.set(campoId ? Number(campoId) : undefined);
    const filtered = this.filteredCultivos();
    this.form.idCultivo = filtered.length === 1 ? filtered[0].idCultivo : undefined;
  }

  saveForm(): void {
    const campoId = this.selectedCampoId();
    if (!this.form.tipoActividad || !this.form.fecha || !campoId) { this.toast.warning('Complete los campos obligatorios'); return; }
    this.isLoading.set(true);
    const userId = this.authService.currentUser()?.idUsuario;
    const payload = { tipoActividad: this.form.tipoActividad, fecha: this.form.fecha, idCampo: Number(campoId), idCultivo: this.form.idCultivo ? Number(this.form.idCultivo) : null, idUsuario: userId, observaciones: this.form.observaciones };
    const editing = this.editingItem();
    const req$ = editing?.idActividad
      ? this.http.put<ActividadCampo>(`${this.apiUrl}/actividades-campo/${editing.idActividad}`, payload)
      : this.http.post<ActividadCampo>(`${this.apiUrl}/actividades-campo`, payload);
    req$.subscribe({
      next: () => { this.isLoading.set(false); this.showModal.set(false); this.loadActividades(); this.toast.success(editing ? 'Actividad actualizada' : 'Actividad registrada'); },
      error: (err) => { this.isLoading.set(false); this.toast.error(err.error?.message || 'Error al guardar'); }
    });
  }

  confirmDelete(item: ActividadCampo): void { this.deletingItem.set(item); this.showDeleteConfirm.set(true); }

  executeDelete(): void {
    const item = this.deletingItem();
    if (!item?.idActividad) return;
    this.http.patch<ActividadCampo>(`${this.apiUrl}/actividades-campo/${item.idActividad}/eliminar`, {}).subscribe({
      next: () => { this.showDeleteConfirm.set(false); this.deletingItem.set(null); this.loadActividades(); this.toast.success('Actividad eliminada'); },
      error: () => { this.showDeleteConfirm.set(false); this.toast.error('Error al eliminar'); }
    });
  }

  restoreActividad(item: ActividadCampo): void {
    if (!item.idActividad) return;
    this.http.patch<ActividadCampo>(`${this.apiUrl}/actividades-campo/${item.idActividad}/restaurar`, {}).subscribe({
      next: () => { this.loadActividades(); this.toast.success('Actividad restaurada'); },
      error: () => this.toast.error('Error al restaurar')
    });
  }

  getIcon(tipo: string): string { return this.actividadIconMap[tipo] ?? 'handyman'; }
  getColor(tipo: string): string { return this.actividadColorMap[tipo] ?? 'bg-gray-100 text-gray-600'; }
  getNombreCampo(idCampo?: number): string { return this.campos().find(c => c.idCampo === idCampo)?.nombre ?? `Campo #${idCampo}`; }
  getNombreCultivo(idCultivo?: number): string { return idCultivo ? this.cultivos().find(c => c.idCultivo === idCultivo)?.nombre ?? `Cultivo #${idCultivo}` : ''; }

  formatFecha(fecha: string): string {
    if (!fecha) return '';
    if (fecha.includes('/')) return fecha;
    try {
      const d = new Date(fecha);
      if (isNaN(d.getTime())) return fecha;
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    } catch { return fecha; }
  }

  /** Convert backend date to yyyy-MM-dd for HTML input */
  private formatDateToInput(fecha: string): string {
    if (!fecha) return new Date().toISOString().split('T')[0];
    if (fecha.includes('/')) {
      const parts = fecha.split('/');
      if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return fecha.split('T')[0];
  }

  formatCreatedAt(dateStr?: string): string {
    if (!dateStr) return '';
    if (dateStr.includes('/')) {
      const parts = dateStr.split(' ');
      if (parts.length === 2) { const t = parts[1].split(':'); return `${parts[0]} ${t[0]}:${t[1]}`; }
      return dateStr;
    }
    return dateStr;
  }
}
