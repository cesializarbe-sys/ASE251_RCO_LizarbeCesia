export interface Clasificacion {
  idClasificacion?: number;
  idCosecha: number;
  calibre: 'PEQUEÑO' | 'MEDIANO' | 'GRANDE' | 'EXTRA_GRANDE';
  estadoFruta: 'BUENA' | 'DAÑADA';
  cantidadKg?: number;
  cantidadUnidades?: number;
  aptoExportacion?: boolean;
  fecha: string;
  estado?: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  restoredAt?: string;
}
