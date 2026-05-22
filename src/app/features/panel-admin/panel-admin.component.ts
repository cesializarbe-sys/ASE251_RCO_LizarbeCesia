import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Usuario } from '../../core/models/usuario.model';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-panel-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './panel-admin.component.html'
})
export class PanelAdminComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private apiUrl = environment.apiUrl;

  isAdmin = computed(() => this.authService.userRole() === 'ADMINISTRADOR');

  allTabs = ['Usuarios', 'Cambiar Contraseña', 'Logs del Sistema'];
  tabs = computed(() =>
    this.allTabs.filter(t => t === 'Usuarios' || this.isAdmin())
  );
  activeTab = signal('Usuarios');
  searchTerm = signal('');
  showModal = signal(false);
  showDeleteConfirm = signal(false);
  editingUser = signal<Usuario | null>(null);
  deletingUser = signal<Usuario | null>(null);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  // Formulario usuario
  form: Partial<Usuario> = {};

  // Formulario cambiar contraseña
  pwForm = { nuevaPassword: '', confirmar: '' };
  pwError = signal<string | null>(null);
  pwSuccess = signal(false);

  usuarios = signal<Usuario[]>([]);

  filteredUsers = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.usuarios().filter(u =>
      !term ||
      u.nombreCompleto.toLowerCase().includes(term) ||
      u.correo.toLowerCase().includes(term) ||
      (u.dni?.toLowerCase().includes(term) ?? false)
    );
  });

  totalAdmins = computed(() => this.usuarios().filter(u => u.rol === 'ADMINISTRADOR').length);
  totalActive  = computed(() => this.usuarios().filter(u => u.estado).length);

  ngOnInit(): void { this.loadUsuarios(); }

  loadUsuarios(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.http.get<Usuario[]>(`${this.apiUrl}/usuarios`).subscribe({
      next: (data) => { this.usuarios.set(data); this.isLoading.set(false); },
      error: (err) => {
        console.error('[PanelAdmin] Error:', err);
        this.errorMessage.set('No se pudo conectar con el servidor.');
        this.isLoading.set(false);
      }
    });
  }

  openCreate(): void {
    this.editingUser.set(null);
    this.form = {
      nombreCompleto: '', correo: '', dni: '', telefono: '', direccion: '',
      password: '', rol: 'ENCARGADO', area: 'CAMPO', estado: true
    };
    this.showModal.set(true);
  }

  openEdit(u: Usuario): void {
    this.editingUser.set(u);
    this.form = { ...u };
    this.showModal.set(true);
  }

  saveForm(): void {
    if (!this.form.nombreCompleto || !this.form.correo) return;
    this.isLoading.set(true);
    const editing = this.editingUser();

    // Build payload without fechaRegistro (backend handles it automatically)
    const payload: Partial<Usuario> = {
      nombreCompleto: this.form.nombreCompleto,
      correo: this.form.correo,
      dni: this.form.dni,
      telefono: this.form.telefono,
      direccion: this.form.direccion,
      rol: this.form.rol,
      area: this.form.area,
      estado: this.form.estado
    };

    // Only include password if provided
    if (this.form.password) {
      payload.password = this.form.password;
    }

    const req$ = editing?.idUsuario
      ? this.http.put<Usuario>(`${this.apiUrl}/usuarios/${editing.idUsuario}`, payload)
      : this.http.post<Usuario>(`${this.apiUrl}/usuarios`, payload);

    req$.subscribe({
      next: () => { this.isLoading.set(false); this.showModal.set(false); this.loadUsuarios(); this.toast.success(editing ? 'Usuario actualizado' : 'Usuario registrado'); },
      error: (err) => { this.isLoading.set(false); this.toast.error(err.error?.message || 'Error al guardar el usuario.'); }
    });
  }

  confirmDelete(u: Usuario): void { this.deletingUser.set(u); this.showDeleteConfirm.set(true); }

  executeDelete(): void {
    const u = this.deletingUser();
    if (!u?.idUsuario) return;
    this.http.patch<Usuario>(`${this.apiUrl}/usuarios/${u.idUsuario}/eliminar`, {}).subscribe({
      next: () => { this.showDeleteConfirm.set(false); this.deletingUser.set(null); this.loadUsuarios(); this.toast.success('Usuario eliminado'); },
      error: () => { this.showDeleteConfirm.set(false); this.toast.error('Error al eliminar'); }
    });
  }

  toggleEstado(u: Usuario): void {
    if (!u.idUsuario) return;
    const endpoint = u.estado ? 'eliminar' : 'restaurar';
    this.http.patch<Usuario>(`${this.apiUrl}/usuarios/${u.idUsuario}/${endpoint}`, {}).subscribe({
      next: () => { this.loadUsuarios(); this.toast.success(u.estado ? 'Usuario desactivado' : 'Usuario restaurado'); },
      error: () => this.toast.error('Error al cambiar estado')
    });
  }

  cambiarPassword(): void {
    this.pwError.set(null);
    if (!this.pwForm.nuevaPassword || this.pwForm.nuevaPassword.length < 6) {
      this.pwError.set('La contraseña debe tener al menos 6 caracteres.'); return;
    }
    if (this.pwForm.nuevaPassword !== this.pwForm.confirmar) {
      this.pwError.set('Las contraseñas no coinciden.'); return;
    }
    const userId = this.authService.currentUser()?.idUsuario;
    if (!userId) return;
    this.http.put(`${this.apiUrl}/usuarios/${userId}`, { password: this.pwForm.nuevaPassword }).subscribe({
      next: () => { this.pwSuccess.set(true); this.pwForm = { nuevaPassword: '', confirmar: '' }; },
      error: (err) => this.pwError.set(err.error?.message || 'Error al cambiar la contraseña.')
    });
  }
}
