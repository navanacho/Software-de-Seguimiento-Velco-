import type { Configuracion } from '../configuracion/contrato.ts';
import type { EtapaOrden } from '../etapas/contrato.ts';
import type { OrdenTrabajo } from '../ordenes/contrato.ts';

export interface ContextoPrueba {
  readonly hoy: string;
  readonly zonaHoraria: string;
  readonly diasAlertaRiesgo: number;
  readonly porcentajeAvanceRiesgo: number;
}

export const HOY = '2026-03-08T12:00:00.000Z';
export const ZONA_HORARIA = 'America/Argentina/Mendoza';

export const CONFIGURACION: Configuracion = {
  id: 1,
  valorHoraEstandar: '0',
  diasAlertaRiesgo: 3,
  porcentajeAvanceRiesgo: 80,
  etapasDefault: ['Corte', 'Soldadura', 'Mecanizado', 'Pintura', 'Entrega'],
};

export const CONTEXTO: ContextoPrueba = {
  hoy: HOY,
  zonaHoraria: ZONA_HORARIA,
  diasAlertaRiesgo: CONFIGURACION.diasAlertaRiesgo,
  porcentajeAvanceRiesgo: CONFIGURACION.porcentajeAvanceRiesgo,
};

export function crearOrden(cambios: Partial<OrdenTrabajo> = {}): OrdenTrabajo {
  return {
    id: 'op-1',
    numeroOp: 'OT-1041',
    clienteId: 'cli-1',
    descripcionPieza: 'Eje de transmision',
    fechaIngreso: '2026-03-01',
    fechaEntrega: '2026-03-12',
    montoVendido: '1250.50',
    observaciones: null,
    createdAt: '2026-03-01T08:00:00.000Z',
    updatedAt: '2026-03-01T08:00:00.000Z',
    ...cambios,
  };
}

export function crearEtapa(cambios: Partial<EtapaOrden> = {}): EtapaOrden {
  return {
    id: 'etapa-1',
    ordenId: 'op-1',
    nombre: 'Corte',
    ordenSecuencia: 1,
    completada: false,
    horasVendidas: '4.00',
    ...cambios,
  };
}

export function crearEtapas(
  nombres: readonly string[],
  completadasHasta = 0,
): EtapaOrden[] {
  return nombres.map((nombre, indice) =>
    crearEtapa({
      id: `etapa-${indice + 1}`,
      nombre,
      ordenSecuencia: indice + 1,
      completada: indice < completadasHasta,
    }),
  );
}
