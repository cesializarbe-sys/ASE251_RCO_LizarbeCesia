import { Campo } from './campo.model';

export interface Cultivo {
  idCultivo?: number;
  nombre: string;
  tipoCultivo: string;
  frecuenciaRiegoDias: number;
  temperaturaIdeal: number;
  fechaSiembra?: string;
  requiereSombra?: boolean;
  estadoSalud?: 'BUENO' | 'EN_RIESGO' | 'CON_PROBLEMAS';
  observaciones?: string;
  campo?: Campo;
  estado?: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  restoredAt?: string;
}
