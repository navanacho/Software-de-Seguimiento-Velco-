import type { EtapaOrden } from '../etapas/contrato.ts';

export function contarCompletadas(etapas: readonly EtapaOrden[]): number {
  return etapas.filter((etapa) => etapa.completada).length;
}

export function calcularAvance(etapas: readonly EtapaOrden[]): number {
  if (etapas.length === 0) {
    return 0;
  }
  return Math.round((100 * contarCompletadas(etapas)) / etapas.length);
}
