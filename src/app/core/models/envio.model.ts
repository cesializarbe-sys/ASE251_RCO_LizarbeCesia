export interface Envio {
  idEnvio?: number;
  paisDestino: string;
  tipoCultivo: string;
  cantidadKg?: number;
  estadoEnvio?: 'EN_PREPARACION' | 'DESPACHADO' | 'ENTREGADO';
  fechaEnvio?: string;
  fechaEntrega?: string;
  documentoDetalle?: string;
  estado?: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  restoredAt?: string;
}

export interface EnvioDetalle {
  idEnvioDetalle?: number;
  idEnvio: number;
  idClasificacion: number;
  cantidadKg?: number;
}
