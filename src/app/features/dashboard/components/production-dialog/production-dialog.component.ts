import { Component, Inject, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-production-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-bold text-[var(--color-text-primary)]">
            {{ data.mode === 'create' ? 'Nuevo Registro de Producción' : 'Editar Registro' }}
          </h2>
          <p class="text-sm text-[var(--color-text-muted)] mt-1">Complete los campos del lote</p>
        </div>
        <button (click)="dialogRef.close()" class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all border-none bg-transparent cursor-pointer">
          <span class="material-icons-outlined">close</span>
        </button>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <mat-form-field appearance="outline">
            <mat-label>Campo / Lote</mat-label>
            <mat-select formControlName="idCampo">
              <mat-option [value]="1">Lote Norte A1</mat-option>
              <mat-option [value]="2">Lote Central B4</mat-option>
              <mat-option [value]="3">Sector Sur D12</mat-option>
              <mat-option [value]="4">Lote Este C2</mat-option>
              <mat-option [value]="5">Lote Oeste F3</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Tipo de Cultivo</mat-label>
            <mat-select formControlName="tipoCultivo">
              <mat-option value="Mandarinas">Mandarinas</mat-option>
              <mat-option value="Arándanos">Arándanos</mat-option>
              <mat-option value="Paltas">Paltas</mat-option>
              <mat-option value="Caqui">Caqui</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <mat-form-field appearance="outline">
            <mat-label>Fecha de cosecha</mat-label>
            <input matInput type="date" formControlName="fecha">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Cantidad (Kg)</mat-label>
            <input matInput type="number" formControlName="cantidadKg" placeholder="0.00">
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Observaciones</mat-label>
          <textarea matInput formControlName="observaciones" rows="3" placeholder="Notas adicionales..."></textarea>
        </mat-form-field>

        <div class="flex justify-end gap-3 pt-2">
          <button type="button" (click)="dialogRef.close()" class="arona-btn-outline">Cancelar</button>
          <button type="submit" [disabled]="form.invalid" class="arona-btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
            {{ data.mode === 'create' ? 'Guardar Registro' : 'Actualizar' }}
          </button>
        </div>
      </form>
    </div>
  `
})
export class ProductionDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  form!: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<ProductionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { mode: 'create' | 'edit'; lote?: any }
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      idCampo: [this.data.lote?.idCampo || '', Validators.required],
      tipoCultivo: [this.data.lote?.cultivo || '', Validators.required],
      fecha: [this.data.lote?.fecha || '', Validators.required],
      cantidadKg: [this.data.lote?.cantidadKg || '', [Validators.required, Validators.min(0)]],
      observaciones: [this.data.lote?.observaciones || '']
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}
