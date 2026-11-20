import type { EtapaOrden } from './contrato.ts';

export function ordenarPorSecuencia(etapas: readonly EtapaOrden[]): EtapaOrden[] {
  return [...etapas].sort((a, b) => a.ordenSecuencia - b.ordenSecuencia);
}
