import { Campo } from './campo.model';
import { Cultivo } from './cultivo.model';
import { Usuario } from './usuario.model';

export interface Cosecha {
  idCosecha?: number;
  fecha: string;
  campo?: Campo;
  cultivo?: Cultivo;
  cantidadKg?: number;
  cantidadUnidades?: number;
  tipoCultivo: string;
  usuario?: Usuario;
  observaciones?: string;
  estado?: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  restoredAt?: string;
}
