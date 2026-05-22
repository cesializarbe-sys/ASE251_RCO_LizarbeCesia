import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AlertaFitosanitaria } from '../../core/models/alerta-fitosanitaria.model';
import { Campo } from '../../core/models/campo.model';
import { Cultivo } from '../../core/models/cultivo.model';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { NotificationService } from '../../shared/services/notification.service';

@Component({
  selector: 'app-enfermedades',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './enfermedades.component.html'
})
export class EnfermedadesComponent implements OnInit {
  private http = inject(HttpClient);
  authService = inject(AuthService);
  private toast = inject(ToastService);
  private notifService = inject(NotificationService);
  private apiUrl = environment.apiUrl;

  selectedDisease = signal<AlertaFitosanitaria | null>(null);
  showModal = signal(false);
  showAtenderModal = signal(false);
  showDeleteConfirm = signal(false);
  isLoading = signal(false);
  editingAlerta = signal<AlertaFitosanitaria | null>(null);
  deletingAlerta = signal<AlertaFitosanitaria | null>(null);

  alertas = signal<AlertaFitosanitaria[]>([]);
  campos = signal<Campo[]>([]);
  cultivos = signal<Cultivo[]>([]);

  isAdmin = computed(() => this.authService.userRole() === 'ADMINISTRADOR');

  selectedCampoId = signal<number | undefined>(undefined);

  form: {
    idCultivoSelected?: number;
    descripcionProblema: string;
    tipoProblema: 'PLAGA' | 'ENFERMEDAD' | 'OTRO';
    fechaDeteccion: string;
  } = { descripcionProblema: '', tipoProblema: 'ENFERMEDAD', fechaDeteccion: '' };

  solucionForm = { solucionAplicada: '', alertaId: 0 };

  tiposProblema: Array<'PLAGA' | 'ENFERMEDAD' | 'OTRO'> = ['PLAGA', 'ENFERMEDAD', 'OTRO'];

  filteredCultivos = computed(() => {
    const campoId = this.selectedCampoId();
    if (!campoId) return this.cultivos();
    return this.cultivos().filter(c => c.campo?.idCampo === Number(campoId));
  });

  ngOnInit(): void { this.loadAlertas(); this.loadCampos(); this.loadCultivos(); }

  loadAlertas(): void {
    this.isLoading.set(true);
    this.http.get<AlertaFitosanitaria[]>(`${this.apiUrl}/alertas`).subscribe({
      next: (data) => { this.alertas.set(data); this.isLoading.set(false); },
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

  getSeverityClass(tipo?: string): string {
    switch (tipo) {
      case 'PLAGA': return 'bg-red-100 text-red-700';
      case 'ENFERMEDAD': return 'bg-orange-100 text-orange-700';
      case 'OTRO': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  getIcon(tipo?: string): string {
    switch (tipo) {
      case 'PLAGA': return '🐛';
      case 'ENFERMEDAD': return '🍂';
      case 'OTRO': return '⚠️';
      default: return '🌿';
    }
  }

  selectDisease(d: AlertaFitosanitaria): void { this.selectedDisease.set(d); }

  openCreate(): void {
    this.editingAlerta.set(null);
    this.selectedCampoId.set(undefined);
    this.form = { idCultivoSelected: undefined, descripcionProblema: '', tipoProblema: 'ENFERMEDAD', fechaDeteccion: new Date().toISOString().split('T')[0] };
    this.showModal.set(true);
  }

  openEdit(alerta: AlertaFitosanitaria): void {
    this.editingAlerta.set(alerta);
    this.selectedCampoId.set(alerta.campo?.idCampo);
    let fechaInput = '';
    if (alerta.fechaDeteccion?.includes('/')) {
      const parts = alerta.fechaDeteccion.split('/');
      if (parts.length === 3) fechaInput = `${parts[2]}-${parts[1]}-${parts[0]}`;
    } else {
      fechaInput = alerta.fechaDeteccion || new Date().toISOString().split('T')[0];
    }
    this.form = { idCultivoSelected: alerta.cultivo?.idCultivo, descripcionProblema: alerta.descripcionProblema, tipoProblema: alerta.tipoProblema as any, fechaDeteccion: fechaInput };
    this.showModal.set(true);
  }

  onCampoChange(campoId: number | undefined): void {
    this.selectedCampoId.set(campoId ? Number(campoId) : undefined);
    const filtered = this.filteredCultivos();
    this.form.idCultivoSelected = filtered.length === 1 ? filtered[0].idCultivo : undefined;
  }

  private formatDateForBackend(dateStr: string): string {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  saveForm(): void {
    const campoId = this.selectedCampoId();
    if (!this.form.descripcionProblema || !campoId) { this.toast.warning('Complete campo y descripción'); return; }
    this.isLoading.set(true);
    const currentUser = this.authService.currentUser();
    const payload = {
      campo: { idCampo: Number(campoId) },
      cultivo: this.form.idCultivoSelected ? { idCultivo: Number(this.form.idCultivoSelected) } : null,
      usuarioReporta: { idUsuario: currentUser?.idUsuario },
      descripcionProblema: this.form.descripcionProblema,
      tipoProblema: this.form.tipoProblema,
      fechaDeteccion: this.formatDateForBackend(this.form.fechaDeteccion)
    };
    const editing = this.editingAlerta();
    const req$ = editing?.idAlerta
      ? this.http.put<AlertaFitosanitaria>(`${this.apiUrl}/alertas/${editing.idAlerta}`, payload)
      : this.http.post<AlertaFitosanitaria>(`${this.apiUrl}/alertas`, payload);
    req$.subscribe({
      next: () => { this.isLoading.set(false); this.showModal.set(false); this.loadAlertas(); this.notifService.refresh(); this.toast.success(editing ? 'Alerta actualizada' : 'Alerta registrada'); },
      error: (err) => { this.isLoading.set(false); this.toast.error(err.error?.message || 'Error al guardar'); }
    });
  }

  openAtender(alerta: AlertaFitosanitaria): void {
    if (!alerta.idAlerta) return;
    this.solucionForm = { solucionAplicada: '', alertaId: alerta.idAlerta };
    this.showAtenderModal.set(true);
  }

  confirmarAtender(): void {
    if (!this.solucionForm.alertaId || !this.solucionForm.solucionAplicada.trim()) return;
    this.isLoading.set(true);
    this.http.patch<AlertaFitosanitaria>(`${this.apiUrl}/alertas/${this.solucionForm.alertaId}/atender`, { solucionAplicada: this.solucionForm.solucionAplicada }).subscribe({
      next: () => { this.isLoading.set(false); this.showAtenderModal.set(false); this.selectedDisease.set(null); this.loadAlertas(); this.notifService.refresh(); this.toast.success('Alerta marcada como ATENDIDA'); },
      error: (err) => { this.isLoading.set(false); this.toast.error(err.error?.message || 'Error al atender'); }
    });
  }

  confirmDelete(alerta: AlertaFitosanitaria): void { this.deletingAlerta.set(alerta); this.showDeleteConfirm.set(true); }

  executeDelete(): void {
    const item = this.deletingAlerta();
    if (!item?.idAlerta) return;
    this.http.patch<AlertaFitosanitaria>(`${this.apiUrl}/alertas/${item.idAlerta}/eliminar`, {}).subscribe({
      next: () => { this.showDeleteConfirm.set(false); this.deletingAlerta.set(null); this.loadAlertas(); this.notifService.refresh(); this.toast.success('Alerta eliminada'); },
      error: () => { this.showDeleteConfirm.set(false); this.toast.error('Error al eliminar'); }
    });
  }

  restoreAlerta(alerta: AlertaFitosanitaria): void {
    if (!alerta.idAlerta) return;
    this.http.patch<AlertaFitosanitaria>(`${this.apiUrl}/alertas/${alerta.idAlerta}/restaurar`, {}).subscribe({
      next: () => { this.loadAlertas(); this.notifService.refresh(); this.toast.success('Alerta restaurada'); },
      error: () => this.toast.error('Error al restaurar')
    });
  }
}
