import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <div class="p-6 max-w-md">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 rounded-full flex items-center justify-center"
             [class]="iconBgClass">
          <span class="material-icons-outlined text-xl" [class]="iconColorClass">
            {{ iconName }}
          </span>
        </div>
        <h2 class="text-lg font-semibold text-[var(--color-text-primary)]">{{ data.title }}</h2>
      </div>

      <p class="text-sm text-[var(--color-text-secondary)] mb-6 leading-relaxed">
        {{ data.message }}
      </p>

      <div class="flex justify-end gap-3">
        <button class="arona-btn-outline text-sm py-2 px-5" (click)="onCancel()">
          {{ data.cancelText || 'Cancelar' }}
        </button>
        <button class="text-sm py-2 px-5 rounded-xl font-semibold text-white border-none cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
                [class]="confirmBtnClass"
                (click)="onConfirm()">
          {{ data.confirmText || 'Confirmar' }}
        </button>
      </div>
    </div>
  `
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  get iconName(): string {
    switch (this.data.type) {
      case 'danger': return 'delete_outline';
      case 'warning': return 'warning_amber';
      default: return 'info';
    }
  }

  get iconBgClass(): string {
    switch (this.data.type) {
      case 'danger': return 'bg-red-50';
      case 'warning': return 'bg-amber-50';
      default: return 'bg-blue-50';
    }
  }

  get iconColorClass(): string {
    switch (this.data.type) {
      case 'danger': return 'text-red-600';
      case 'warning': return 'text-amber-600';
      default: return 'text-blue-600';
    }
  }

  get confirmBtnClass(): string {
    switch (this.data.type) {
      case 'danger': return 'bg-red-600 hover:bg-red-700 hover:shadow-lg';
      case 'warning': return 'bg-amber-600 hover:bg-amber-700 hover:shadow-lg';
      default: return 'bg-[var(--color-arona-500)] hover:bg-[var(--color-arona-600)] hover:shadow-lg';
    }
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
