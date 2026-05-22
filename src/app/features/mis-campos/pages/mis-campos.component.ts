import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CamposService } from '../services/campos.service';
import { CampoDialogComponent } from '../components/campo-dialog/campo-dialog.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { Campo } from '../../../core/models/campo.model';

@Component({
  selector: 'app-mis-campos',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './mis-campos.component.html'
})
export class MisCamposComponent implements OnInit {
  camposService = inject(CamposService);
  private dialog = inject(MatDialog);
  viewMode: 'grid' | 'list' = 'grid';
  selectedCampo = signal<Campo | null>(null);
  showDetail = signal(false);

  ngOnInit(): void {
    this.camposService.loadCampos();
  }

  onSearch(event: Event): void {
    this.camposService.searchTerm.set((event.target as HTMLInputElement).value);
  }

  getEstado(campo: Campo): string {
    return campo.estado ? 'Activo' : 'Inactivo';
  }

  getEstadoClass(campo: Campo): string {
    return campo.estado ? 'badge-success' : 'badge-danger';
  }

  viewDetail(campo: Campo): void {
    this.selectedCampo.set(campo);
    this.showDetail.set(true);
  }

  closeDetail(): void {
    this.showDetail.set(false);
    this.selectedCampo.set(null);
  }

  openNewCampo(): void {
    const ref = this.dialog.open(CampoDialogComponent, {
      width: '520px', disableClose: true, data: { mode: 'create' }
    });
    ref.afterClosed().subscribe(r => { if (r) this.camposService.loadCampos(); });
  }

  editCampo(campo: Campo): void {
    const ref = this.dialog.open(CampoDialogComponent, {
      width: '520px', disableClose: true, data: { mode: 'edit', campo }
    });
    ref.afterClosed().subscribe(r => { if (r) this.camposService.loadCampos(); });
  }

  /** Toggle campo active/inactive via PATCH endpoints */
  toggleEstado(campo: Campo): void {
    if (!campo.idCampo) return;
    const req$ = campo.estado
      ? this.camposService.deleteCampo(campo.idCampo)
      : this.camposService.restoreCampo(campo.idCampo);
    req$.subscribe({
      next: () => this.camposService.loadCampos(),
      error: (err) => console.error('[MisCampos] Error toggle estado:', err)
    });
  }

  deleteCampo(campo: Campo): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: { title: 'Eliminar Campo', message: `¿Eliminar "${campo.nombre}"? Esta acción es reversible.`, type: 'danger', confirmText: 'Eliminar' }
    });
    ref.afterClosed().subscribe(r => {
      if (r && campo.idCampo) {
        this.camposService.deleteCampo(campo.idCampo).subscribe(() => this.camposService.loadCampos());
      }
    });
  }
}
