import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Cultivo } from '../../core/models/cultivo.model';
import { Campo } from '../../core/models/campo.model';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-cultivos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cultivos.component.html'
})
export class CultivosComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private apiUrl = environment.apiUrl;

  cultivos = signal<Cultivo[]>([]);
  campos = signal<Campo[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  showModal = signal(false);
  showDeleteConfirm = signal(false);
  editingItem = signal<Cultivo | null>(null);
  deletingItem = signal<Cultivo | null>(null);
  searchTerm = signal('');

  isAdmin = computed(() => this.authService.userRole() === 'ADMINISTRADOR');

  form: Partial<Cultivo> & { idCampoSelected?: number; fechaSiembraInput?: string } = {};

  tiposCultivo = ['MANDARINA', 'PALTA', 'ARANDANO', 'CAQUI', 'UVA'];
  estadosSalud: Array<'BUENO' | 'EN_RIESGO' | 'CON_PROBLEMAS'> = ['BUENO', 'EN_RIESGO', 'CON_PROBLEMAS'];

  filteredCultivos = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.cultivos().filter(c =>
      !term || c.nombre.toLowerCase().includes(term) || c.tipoCultivo.toLowerCase().includes(term)
    );
  });

  ngOnInit(): void {
    this.loadCultivos();
    this.loadCampos();
  }

  loadCultivos(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.http.get<Cultivo[]>(`${this.apiUrl}/cultivos`).subscribe({
      next: (data) => { this.cultivos.set(data); this.isLoading.set(false); },
      error: () => { this.toast.error('No se pudo conectar con el servidor.'); this.isLoading.set(false); }
    });
  }

  loadCampos(): void {
    this.http.get<Campo[]>(`${this.apiUrl}/campos/estado/true`).subscribe({
      next: (data) => this.campos.set(data),
      error: (err) => console.error('[Cultivos] Error al cargar campos:', err)
    });
  }

  openCreate(): void {
    this.editingItem.set(null);
    this.form = {
      nombre: '', tipoCultivo: 'MANDARINA',
      frecuenciaRiegoDias: 3, temperaturaIdeal: 20,
      requiereSombra: false, estadoSalud: 'BUENO',
      observaciones: '',
      idCampoSelected: undefined,
      fechaSiembraInput: ''
    };
    this.showModal.set(true);
  }

  openEdit(item: Cultivo): void {
    this.editingItem.set(item);
    // Convert dd/MM/yyyy from backend to yyyy-MM-dd for HTML input
    let fechaInput = '';
    if (item.fechaSiembra) {
      const parts = item.fechaSiembra.split('/');
      if (parts.length === 3) {
        fechaInput = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }
    this.form = {
      ...item,
      idCampoSelected: item.campo?.idCampo,
      fechaSiembraInput: fechaInput
    };
    this.showModal.set(true);
  }

  /** Convert yyyy-MM-dd to dd/MM/yyyy for backend */
  private formatDateForBackend(dateStr?: string): string | null {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  saveForm(): void {
    if (!this.form.nombre || !this.form.tipoCultivo || !this.form.idCampoSelected) { this.toast.warning('Complete los campos obligatorios'); return; }
    this.isLoading.set(true);
    const payload = {
      nombre: this.form.nombre, tipoCultivo: this.form.tipoCultivo,
      frecuenciaRiegoDias: this.form.frecuenciaRiegoDias, temperaturaIdeal: this.form.temperaturaIdeal,
      fechaSiembra: this.formatDateForBackend(this.form.fechaSiembraInput),
      requiereSombra: this.form.requiereSombra ?? false, estadoSalud: this.form.estadoSalud,
      observaciones: this.form.observaciones, campo: { idCampo: Number(this.form.idCampoSelected) }
    };
    const editing = this.editingItem();
    const req$ = editing?.idCultivo
      ? this.http.put<Cultivo>(`${this.apiUrl}/cultivos/${editing.idCultivo}`, payload)
      : this.http.post<Cultivo>(`${this.apiUrl}/cultivos`, payload);
    req$.subscribe({
      next: () => { this.isLoading.set(false); this.showModal.set(false); this.loadCultivos(); this.toast.success(editing ? 'Cultivo actualizado' : 'Cultivo registrado'); },
      error: (err) => { this.isLoading.set(false); this.toast.error(err.error?.message || 'Error al guardar'); }
    });
  }

  confirmDelete(item: Cultivo): void {
    this.deletingItem.set(item);
    this.showDeleteConfirm.set(true);
  }

  executeDelete(): void {
    const item = this.deletingItem();
    if (!item?.idCultivo) return;
    this.http.patch<Cultivo>(`${this.apiUrl}/cultivos/${item.idCultivo}/eliminar`, {}).subscribe({
      next: () => { this.showDeleteConfirm.set(false); this.deletingItem.set(null); this.loadCultivos(); this.toast.success('Cultivo eliminado'); },
      error: () => { this.showDeleteConfirm.set(false); this.toast.error('Error al eliminar'); }
    });
  }

  restoreCultivo(item: Cultivo): void {
    if (!item.idCultivo) return;
    this.http.patch<Cultivo>(`${this.apiUrl}/cultivos/${item.idCultivo}/restaurar`, {}).subscribe({
      next: () => { this.loadCultivos(); this.toast.success('Cultivo restaurado'); },
      error: () => this.toast.error('Error al restaurar')
    });
  }

  getSaludClass(salud?: string): string {
    switch (salud) {
      case 'BUENO': return 'badge-success';
      case 'EN_RIESGO': return 'badge-warning';
      case 'CON_PROBLEMAS': return 'badge-danger';
      default: return 'badge-neutral';
    }
  }

  getSaludIcon(salud?: string): string {
    switch (salud) {
      case 'BUENO': return 'check_circle';
      case 'EN_RIESGO': return 'warning_amber';
      case 'CON_PROBLEMAS': return 'error';
      default: return 'help_outline';
    }
  }
}
