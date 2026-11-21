import type { TarjetaOrdenDTO, EtapaTarjeta, GrupoFlujo } from '@velco/domain';
import type { RespuestaListadoTablero } from '../../src/shared/domain-client/tipos.ts';

export function crearEtapa(parcial: Partial<EtapaTarjeta> = {}): EtapaTarjeta {
  return { id: 'e1', nombre: 'Corte', ordenSecuencia: 1, completada: false, ...parcial };
}

export function crearTarjeta(parcial: Partial<TarjetaOrdenDTO> = {}): TarjetaOrdenDTO {
  return {
    id: 'op1', numeroOp: 'OT-1', clienteId: 'c1', clienteNombre: 'Cliente',
    descripcionPieza: 'Pieza', etapas: [crearEtapa()],
    avance: 0, semaforo: 'En plazo', diasRestantes: 2, etapaAhora: 'Corte', etiquetaPlazo: 'Faltan 2 días',
    ...parcial,
  };
}

export function crearEnvelope(parcial: Partial<RespuestaListadoTablero> = {}): RespuestaListadoTablero {
  const flujo: readonly GrupoFlujo[] = parcial.flujo ?? [{ etapa: 'Corte', cantidad: 1 }];
  return {
    ops: parcial.ops ?? [crearTarjeta()],
    kpis: parcial.kpis ?? { total: 1, porEstado: { Terminado: 0, Atrasado: 0, 'En riesgo': 0, 'En plazo': 1 } },
    flujo,
  };
}
