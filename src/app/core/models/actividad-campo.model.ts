export interface ActividadCampo {
  idActividad?: number;
  tipoActividad: 'RIEGO' | 'PODA' | 'FUMIGACION' | 'FERTILIZACION' | 'OTRO';
  fecha: string;
  idCampo: number;
  idCultivo?: number;
  idUsuario: number;
  observaciones?: string;
  estado?: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  restoredAt?: string;
}
