import type { RespuestaSalud } from '@velco/domain';

export function obtenerSalud(): RespuestaSalud {
  return { estado: 'ok' };
}
