import { Component, Inject, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CamposService } from '../../services/campos.service';
import { Campo } from '../../../../core/models/campo.model';

@Component({
  selector: 'app-campo-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule],
  template: `
    <div class="p-6 animate-scale-in">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-bold text-gray-800">
            {{ data.mode === 'create' ? 'Nuevo Campo' : 'Editar Campo' }}
          </h2>
          <p class="text-sm text-gray-500 mt-1">
            {{ data.mode === 'create' ? 'Registrar un nuevo lote de cultivo' : 'Modificar datos del campo' }}
          </p>
        </div>
        <button (click)="dialogRef.close()"
          class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all border-none bg-transparent cursor-pointer">
          <span class="material-icons-outlined">close</span>
        </button>
      </div>

      <!-- Error Message -->
      @if (errorMessage) {
        <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <span class="material-icons-outlined text-red-500 text-lg mt-0.5">error</span>
          <div>
            <p class="text-sm font-medium text-red-700">Error al guardar</p>
            <p class="text-xs text-red-600 mt-0.5">{{ errorMessage }}</p>
          </div>
          <button (click)="errorMessage = null" class="ml-auto text-red-400 hover:text-red-600 bg-transparent border-none cursor-pointer">
            <span class="material-icons-outlined text-sm">close</span>
          </button>
        </div>
      }

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
        <!-- Nombre -->
        <div>
          <label class="text-xs font-semibold uppercase tracking-wider text-gray-500">Nombre del Campo *</label>
          <div class="relative mt-1">
            <span class="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">landscape</span>
            <input type="text" formControlName="nombre" placeholder="Ej: Lote Norte A1"
              class="w-full pl-10 pr-4 py-2.5 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all"
              [class]="form.get('nombre')?.invalid && form.get('nombre')?.touched ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-green-500'" />
          </div>
          @if (form.get('nombre')?.hasError('required') && form.get('nombre')?.touched) {
            <p class="text-xs text-red-500 mt-1 flex items-center gap-1">
              <span class="material-icons-outlined text-sm">error</span> El nombre es obligatorio
            </p>
          }
        </div>

        <!-- Ubicación + Hectáreas -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-xs font-semibold uppercase tracking-wider text-gray-500">Ubicación</label>
            <div class="relative mt-1">
              <span class="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">location_on</span>
              <input type="text" formControlName="ubicacion" placeholder="Ej: Valle de Cañete"
                class="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all" />
            </div>
          </div>
          <div>
            <label class="text-xs font-semibold uppercase tracking-wider text-gray-500">Hectáreas *</label>
            <div class="relative mt-1">
              <span class="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">straighten</span>
              <input type="number" formControlName="hectareas" step="0.01" placeholder="0.00"
                class="w-full pl-10 pr-4 py-2.5 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all"
                [class]="form.get('hectareas')?.invalid && form.get('hectareas')?.touched ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-green-500'" />
            </div>
            @if (form.get('hectareas')?.hasError('min') && form.get('hectareas')?.touched) {
              <p class="text-xs text-red-500 mt-1 flex items-center gap-1">
                <span class="material-icons-outlined text-sm">error</span> Debe ser mayor a 0
              </p>
            }
          </div>
        </div>

        <!-- Responsable + Sistema Riego -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-xs font-semibold uppercase tracking-wider text-gray-500">Responsable</label>
            <div class="relative mt-1">
              <span class="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">person</span>
              <input type="text" formControlName="responsable" placeholder="Ej: Juan Pérez"
                class="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all" />
            </div>
          </div>
          <div>
            <label class="text-xs font-semibold uppercase tracking-wider text-gray-500">Sistema de Riego</label>
            <div class="relative mt-1">
              <span class="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">water_drop</span>
              <input type="text" formControlName="sistemaRiego" placeholder="Ej: Goteo"
                class="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all" />
            </div>
          </div>
        </div>

        <!-- Estado toggle (only for edit) -->
        @if (data.mode === 'edit') {
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p class="text-sm font-medium text-gray-800">Estado del Campo</p>
              <p class="text-xs text-gray-500">{{ form.get('estado')?.value ? 'Activo' : 'Inactivo' }}</p>
            </div>
            <button type="button" (click)="toggleEstado()"
              class="w-12 h-6 rounded-full relative cursor-pointer border-none transition-all"
              [class]="form.get('estado')?.value ? 'bg-green-500' : 'bg-gray-300'">
              <div class="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm"
                [class]="form.get('estado')?.value ? 'left-6' : 'left-0.5'"></div>
            </button>
          </div>
        }

        <!-- Preview Card -->
        @if (form.get('nombre')?.value) {
          <div class="border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50/50">
            <p class="text-xs text-gray-400 uppercase font-semibold mb-2">Vista previa</p>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                [class]="getPreviewBg()">
                {{ getPreviewIcon() }}
              </div>
              <div>
                <p class="text-sm font-bold text-gray-800">{{ form.get('nombre')?.value }}</p>
                <p class="text-xs text-gray-500">{{ form.get('ubicacion')?.value || 'Sin ubicación' }} · {{ form.get('hectareas')?.value || 0 }} ha</p>
              </div>
            </div>
          </div>
        }

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" (click)="dialogRef.close()" class="arona-btn-outline">Cancelar</button>
          <button type="submit" [disabled]="form.invalid || isLoading"
            class="arona-btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
            @if (isLoading) {
              <span class="animate-spin material-icons-outlined text-lg">refresh</span> Guardando...
            } @else {
              <span class="material-icons-outlined text-lg">{{ data.mode === 'create' ? 'add_circle' : 'save' }}</span>
              {{ data.mode === 'create' ? 'Crear Campo' : 'Guardar Cambios' }}
            }
          </button>
        </div>
      </form>
    </div>
  `
})
export class CampoDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private camposService = inject(CamposService);
  form!: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;

  cultivos = [
    { nombre: 'Mandarinas', icon: '🍊', activeClass: 'bg-orange-500 text-white' },
    { nombre: 'Arándanos', icon: '🫐', activeClass: 'bg-blue-600 text-white' },
    { nombre: 'Paltas', icon: '🥑', activeClass: 'bg-green-600 text-white' },
    { nombre: 'Caqui', icon: '🍑', activeClass: 'bg-red-500 text-white' },
  ];

  constructor(
    public dialogRef: MatDialogRef<CampoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { mode: 'create' | 'edit'; campo?: Campo }
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre: [this.data.campo?.nombre || '', Validators.required],
      ubicacion: [this.data.campo?.ubicacion || ''],
      hectareas: [this.data.campo?.hectareas || '', [Validators.required, Validators.min(0.01)]],
      responsable: [this.data.campo?.responsable || ''],
      sistemaRiego: [this.data.campo?.sistemaRiego || ''],
      observaciones: [this.data.campo?.observaciones || ''],
      estado: [this.data.campo?.estado ?? true]
    });
  }

  toggleEstado() {
    this.form.patchValue({ estado: !this.form.get('estado')?.value });
  }

  getPreviewBg(): string { return 'bg-green-100'; }

  getPreviewIcon(): string { return '🌱'; }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.isLoading = true;
    this.errorMessage = null;
    const campo: Campo = { ...this.form.value };

    if (this.data.mode === 'create') {
      this.camposService.createCampo(campo).subscribe({
        next: () => { this.isLoading = false; this.dialogRef.close(true); },
        error: (err) => {
          this.isLoading = false;
          console.error('[CampoDialog] Error al crear campo:', err);
          this.errorMessage = err.error?.message || err.error?.error || err.message || 'Error al crear el campo. Verifique los datos e intente nuevamente.';
        }
      });
    } else if (this.data.campo?.idCampo) {
      this.camposService.updateCampo(this.data.campo.idCampo, campo).subscribe({
        next: () => { this.isLoading = false; this.dialogRef.close(true); },
        error: (err) => {
          this.isLoading = false;
          console.error('[CampoDialog] Error al editar campo:', err);
          this.errorMessage = err.error?.message || err.error?.error || err.message || 'Error al actualizar el campo. Verifique los datos e intente nuevamente.';
        }
      });
    }
  }
}
