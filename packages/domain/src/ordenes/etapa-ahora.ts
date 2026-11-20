import type { EtapaOrden } from '../etapas/contrato.ts';
import { ordenarPorSecuencia } from '../etapas/orden.ts';

export function etapaAhora(etapas: readonly EtapaOrden[]): EtapaOrden | 'Todo listo' {
  const ordenadas = ordenarPorSecuencia(etapas);
  return ordenadas.find((etapa) => !etapa.completada) ?? 'Todo listo';
}
