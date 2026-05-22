export interface Producto {
  idProducto?: number;
  nombre: string;
  tipoCultivo: string;
  descripcion?: string;
  cantidadKg: number;
  cantidadCajas?: number;
  unidadMedida?: string;
  fechaIngreso?: string;
  umbralMinimo?: number;
  idCosecha?: number;
  estado?: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  restoredAt?: string;
}
