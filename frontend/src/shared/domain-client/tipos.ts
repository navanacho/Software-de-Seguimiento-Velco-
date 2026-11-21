import type { EstadoSemaforo, GrupoFlujo, TarjetaOrdenDTO } from '@velco/domain';

export interface KpisTablero {
  readonly total: number;
  readonly porEstado: Record<EstadoSemaforo, number>;
}

export interface RespuestaListadoTablero {
  readonly ops: readonly TarjetaOrdenDTO[];
  readonly kpis: KpisTablero;
  readonly flujo: readonly GrupoFlujo[];
}
