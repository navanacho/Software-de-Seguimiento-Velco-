export const RUTA_SALUD = '/api/health' as const;

export type EstadoSalud = 'ok';

export interface RespuestaSalud {
  estado: EstadoSalud;
}
