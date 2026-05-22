export interface Usuario {
  idUsuario?: number;
  nombreCompleto: string;
  correo: string;
  password?: string;
  dni?: string;
  telefono?: string;
  direccion?: string;
  rol?: 'ENCARGADO' | 'ADMINISTRADOR';
  area?: 'CAMPO' | 'PLANTA' | 'ALMACEN' | 'ADMINISTRACION' | 'CALIDAD';
  estado?: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  restoredAt?: string;
}
