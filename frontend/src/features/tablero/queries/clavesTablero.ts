import type { FiltrosTablero } from '../../../shared/domain-client/consultarTablero.ts';

export function clavesTablero(filtros: FiltrosTablero) {
  return ['tablero', filtros] as const;
}
