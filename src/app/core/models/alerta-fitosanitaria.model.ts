import { Campo } from './campo.model';
import { Cultivo } from './cultivo.model';
import { Usuario } from './usuario.model';

export interface AlertaFitosanitaria {
  idAlerta?: number;
  campo?: Campo;
  cultivo?: Cultivo;
  descripcionProblema: string;
  tipoProblema: 'PLAGA' | 'ENFERMEDAD' | 'OTRO';
  estadoAlerta?: 'PENDIENTE' | 'ATENDIDO';
  solucionAplicada?: string;
  fechaDeteccion: string;
  fechaResolucion?: string;
  usuarioReporta?: Usuario;
  estado?: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  restoredAt?: string;
}
