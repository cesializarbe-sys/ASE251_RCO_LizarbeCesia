import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Campo } from '../../../core/models/campo.model';

@Injectable({ providedIn: 'root' })
export class CamposService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  campos = signal<Campo[]>([]);
  searchTerm = signal('');
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  filteredCampos = computed(() => {
    let result = this.campos();
    const search = this.searchTerm().toLowerCase();

    if (search) {
      result = result.filter(c =>
        c.nombre.toLowerCase().includes(search) ||
        (c.ubicacion?.toLowerCase().includes(search) ?? false) ||
        (c.responsable?.toLowerCase().includes(search) ?? false)
      );
    }
    return result;
  });

  totalHectareas = computed(() =>
    this.campos().reduce((sum, c) => sum + c.hectareas, 0)
  );

  /** Load ALL campos (not just active) so toggle estado works */
  loadCampos(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.http.get<Campo[]>(`${this.apiUrl}/campos`).subscribe({
      next: (data) => {
        this.campos.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('[CamposService] Error al cargar campos:', err);
        this.errorMessage.set('No se pudo conectar con el servidor. Verifique que el backend esté corriendo.');
        this.campos.set([]);
        this.isLoading.set(false);
      }
    });
  }

  createCampo(campo: Campo) {
    return this.http.post<Campo>(`${this.apiUrl}/campos`, campo);
  }

  updateCampo(id: number, campo: Campo) {
    return this.http.put<Campo>(`${this.apiUrl}/campos/${id}`, campo);
  }

  deleteCampo(id: number) {
    return this.http.patch<Campo>(`${this.apiUrl}/campos/${id}/eliminar`, {});
  }

  restoreCampo(id: number) {
    return this.http.patch<Campo>(`${this.apiUrl}/campos/${id}/restaurar`, {});
  }
}
