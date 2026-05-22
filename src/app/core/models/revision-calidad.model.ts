import { Cosecha } from './cosecha.model';
import { Usuario } from './usuario.model';

export interface RevisionCalidad {
  idRevision?: number;
  cosecha?: Cosecha;
  cumpleRequisitos: boolean;
  observaciones?: string;
  supervisor?: Usuario;
  fecha: string;
  notificado?: boolean;
  estado?: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  restoredAt?: string;
}
