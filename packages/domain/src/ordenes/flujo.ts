import type { EtapaOrden } from '../etapas/contrato.ts';
import type { OrdenTrabajo } from './contrato.ts';
import { etapaAhora } from './etapa-ahora.ts';

export interface OrdenConEtapas {
  readonly orden: OrdenTrabajo;
  readonly etapas: readonly EtapaOrden[];
}

export interface GrupoFlujo {
  readonly etapa: string;
  readonly cantidad: number;
}

function normalizarConteos(conteos: ReadonlyMap<string, number>): GrupoFlujo[] {
  return [...conteos.entries()]
    .map(([etapa, cantidad]) => ({ etapa, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad || a.etapa.localeCompare(b.etapa));
}

export function agruparFlujo(ordenes: readonly OrdenConEtapas[]): GrupoFlujo[] {
  const conteos = new Map<string, number>();
  for (const item of ordenes) {
    const actual = etapaAhora(item.etapas);
    if (actual === 'Todo listo') {
      continue;
    }
    conteos.set(actual.nombre, (conteos.get(actual.nombre) ?? 0) + 1);
  }
  return normalizarConteos(conteos);
}
