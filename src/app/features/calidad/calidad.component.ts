import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { RevisionCalidad } from '../../core/models/revision-calidad.model';
import { Cosecha } from '../../core/models/cosecha.model';
import { Usuario } from '../../core/models/usuario.model';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-calidad',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './calidad.component.html'
})
export class CalidadComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private apiUrl = environment.apiUrl;

  showModal = signal(false);
  showDeleteConfirm = signal(false);
  editingItem = signal<RevisionCalidad | null>(null);
  deletingItem = signal<RevisionCalidad | null>(null);
  isLoading = signal(false);

  revisiones = signal<RevisionCalidad[]>([]);
  cosechas = signal<Cosecha[]>([]);
  usuarios = signal<Usuario[]>([]);

  form: {
    idCosechaSelected?: number; idSupervisorSelected?: number;
    cumpleRequisitos: boolean; observaciones?: string; fecha: string;
  } = { cumpleRequisitos: true, fecha: new Date().toISOString().split('T')[0] };

  aprobadas = computed(() => this.revisiones().filter(r => r.cumpleRequisitos).length);
  rechazadas = computed(() => this.revisiones().filter(r => !r.cumpleRequisitos).length);
  tasa = computed(() => this.revisiones().length ? ((this.aprobadas() / this.revisiones().length) * 100).toFixed(1) : '0');
  notificacionesPendientes = computed(() => this.revisiones().filter(r => r.notificado && !r.cumpleRequisitos).length);

  ngOnInit(): void { this.loadRevisiones(); this.loadCosechas(); this.loadUsuarios(); }

  loadRevisiones(): void {
    this.isLoading.set(true);
    this.http.get<RevisionCalidad[]>(`${this.apiUrl}/revisiones-calidad`).subscribe({
      next: (data) => { this.revisiones.set(data); this.isLoading.set(false); },
      error: () => { this.toast.error('No se pudo conectar con el servidor.'); this.isLoading.set(false); }
    });
  }

  loadCosechas(): void {
    this.http.get<Cosecha[]>(`${this.apiUrl}/cosechas`).subscribe({
      next: (data) => this.cosechas.set(data),
      error: () => this.toast.error('Error al cargar cosechas')
    });
  }

  loadUsuarios(): void {
    this.http.get<Usuario[]>(`${this.apiUrl}/usuarios`).subscribe({
      next: (data) => this.usuarios.set(data),
      error: () => this.toast.error('Error al cargar usuarios')
    });
  }

  openCreate() {
    this.editingItem.set(null);
    const currentUser = this.authService.currentUser();
    this.form = { idCosechaSelected: undefined, idSupervisorSelected: currentUser?.idUsuario, cumpleRequisitos: true, observaciones: '', fecha: new Date().toISOString().split('T')[0] };
    this.showModal.set(true);
  }

  openEdit(item: RevisionCalidad) {
    this.editingItem.set(item);
    let fechaInput = item.fecha;
    if (item.fecha?.includes('/')) {
      const parts = item.fecha.split('/');
      if (parts.length === 3) fechaInput = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    this.form = { idCosechaSelected: item.cosecha?.idCosecha, idSupervisorSelected: item.supervisor?.idUsuario, cumpleRequisitos: item.cumpleRequisitos, observaciones: item.observaciones, fecha: fechaInput };
    this.showModal.set(true);
  }

  private formatDateForBackend(dateStr: string): string {
    if (!dateStr) return dateStr;
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  saveForm() {
    if (!this.form.idCosechaSelected || !this.form.idSupervisorSelected) { this.toast.warning('Seleccione cosecha y supervisor'); return; }
    this.isLoading.set(true);
    const payload = { cosecha: { idCosecha: Number(this.form.idCosechaSelected) }, supervisor: { idUsuario: Number(this.form.idSupervisorSelected) }, cumpleRequisitos: this.form.cumpleRequisitos, observaciones: this.form.observaciones, fecha: this.formatDateForBackend(this.form.fecha) };
    const editing = this.editingItem();
    const req$ = editing?.idRevision
      ? this.http.put<RevisionCalidad>(`${this.apiUrl}/revisiones-calidad/${editing.idRevision}`, payload)
      : this.http.post<RevisionCalidad>(`${this.apiUrl}/revisiones-calidad`, payload);
    req$.subscribe({
      next: () => { this.isLoading.set(false); this.showModal.set(false); this.loadRevisiones(); this.toast.success(editing ? 'Revisión actualizada' : 'Revisión registrada'); },
      error: (err) => { this.isLoading.set(false); this.toast.error(err.error?.message || 'Error al guardar'); }
    });
  }

  getCosechaLabel(cosecha?: Cosecha): string {
    if (!cosecha) return '—';
    return `${cosecha.tipoCultivo} · ${cosecha.campo?.nombre || '?'}`;
  }

  /** Estado basado en rev.estado (true=Activo, false=Inactivo) */
  getEstadoLabel(rev: RevisionCalidad): string { return rev.estado !== false ? 'Activo' : 'Inactivo'; }
  getEstadoClass(rev: RevisionCalidad): string { return rev.estado !== false ? 'badge-success' : 'badge-danger'; }

  confirmDelete(item: RevisionCalidad) { this.deletingItem.set(item); this.showDeleteConfirm.set(true); }

  executeDelete() {
    const item = this.deletingItem();
    if (!item?.idRevision) return;
    this.http.patch<RevisionCalidad>(`${this.apiUrl}/revisiones-calidad/${item.idRevision}/eliminar`, {}).subscribe({
      next: () => { this.showDeleteConfirm.set(false); this.deletingItem.set(null); this.loadRevisiones(); this.toast.success('Revisión eliminada'); },
      error: () => { this.showDeleteConfirm.set(false); this.toast.error('Error al eliminar'); }
    });
  }

  restoreRevision(item: RevisionCalidad) {
    if (!item.idRevision) return;
    this.http.patch<RevisionCalidad>(`${this.apiUrl}/revisiones-calidad/${item.idRevision}/restaurar`, {}).subscribe({
      next: () => { this.loadRevisiones(); this.toast.success('Revisión restaurada'); },
      error: () => this.toast.error('Error al restaurar')
    });
  }
}
