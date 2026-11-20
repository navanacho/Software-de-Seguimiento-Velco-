import type { EtapaOrden } from '../etapas/contrato.ts';
import { calcularAvance } from '../ordenes/avance.ts';
import type { OrdenTrabajo } from '../ordenes/contrato.ts';
import type { ContextoPlazo, EstadoSemaforo } from './contrato.ts';
import { diasRestantes } from './plazo.ts';

function esTerminado(etapas: readonly EtapaOrden[], avance: number): boolean {
  return avance >= 100 || (etapas.length > 0 && etapas.every((etapa) => etapa.completada));
}

function esEnRiesgo(
  dias: number,
  avance: number,
  contexto: ContextoPlazo,
): boolean {
  return dias <= contexto.diasAlertaRiesgo && avance < contexto.porcentajeAvanceRiesgo;
}

export function calcularSemaforo(
  orden: OrdenTrabajo,
  etapas: readonly EtapaOrden[],
  contexto: ContextoPlazo,
  avance: number = calcularAvance(etapas),
): EstadoSemaforo {
  if (esTerminado(etapas, avance)) {
    return 'Terminado';
  }
  const dias = diasRestantes(orden, contexto);
  if (dias < 0) {
    return 'Atrasado';
  }
  if (esEnRiesgo(dias, avance, contexto)) {
    return 'En riesgo';
  }
  return 'En plazo';
}
