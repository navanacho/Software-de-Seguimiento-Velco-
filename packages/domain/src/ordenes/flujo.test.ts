import { describe, expect, it } from 'vitest';
import type { EtapaOrden } from '../etapas/contrato.ts';
import { crearEtapas, crearOrden } from '../testing/fixtures.ts';
import { agruparFlujo, type OrdenConEtapas } from './flujo.ts';

function op(id: string, etapas: readonly EtapaOrden[]): OrdenConEtapas {
  return { orden: crearOrden({ id, numeroOp: id }), etapas };
}

const soldadura = () => crearEtapas(['Corte', 'Soldadura'], 1);
const pintura = () => crearEtapas(['Corte', 'Soldadura', 'Pintura'], 2);

describe('agruparFlujo', () => {
  it('RN-FLujo-01: agrupa dos OPs activas en Soldadura y una en Pintura', () => {
    const ops = [
      op('OT-1', soldadura()),
      op('OT-2', pintura()),
      op('OT-3', soldadura()),
    ];
    expect(agruparFlujo(ops)).toEqual([
      { etapa: 'Soldadura', cantidad: 2 },
      { etapa: 'Pintura', cantidad: 1 },
    ]);
  });

  it('HU-06: excluye la OP terminada y la OP sin etapas del flujo', () => {
    const ops = [
      op('OT-TERMINADA', crearEtapas(['Corte', 'Soldadura'], 2)),
      op('OT-SIN-ETAPAS', []),
      op('OT-ACTIVA', soldadura()),
    ];
    expect(agruparFlujo(ops)).toEqual([{ etapa: 'Soldadura', cantidad: 1 }]);
  });

  it('RN-FLujo-01: el orden del resultado es estable con entradas permutadas', () => {
    const primera = op('OT-1', soldadura());
    const segunda = op('OT-2', pintura());
    const tercera = op('OT-3', crearEtapas(['Corte', 'Pintura'], 1));
    const cuarta = op('OT-4', soldadura());
    expect(agruparFlujo([primera, segunda, tercera, cuarta])).toEqual(
      agruparFlujo([cuarta, tercera, segunda, primera]),
    );
  });
});
