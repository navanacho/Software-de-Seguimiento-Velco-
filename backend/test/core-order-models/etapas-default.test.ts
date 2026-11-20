import type { Prisma } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { convertirEtapasDefault } from '../../src/features/configuracion/prisma/etapas-default.ts';

const etapasCanonicas: Prisma.JsonValue = ['Corte', 'Soldadura', 'Mecanizado', 'Pintura', 'Entrega'];

describe('convertirEtapasDefault', () => {
  it('devuelve la lista completa como readonly string[]', () => {
    expect(convertirEtapasDefault(etapasCanonicas)).toEqual([
      'Corte',
      'Soldadura',
      'Mecanizado',
      'Pintura',
      'Entrega',
    ]);
  });

  it('rechaza una lista incompleta', () => {
    const incompleta: Prisma.JsonValue = ['Corte', 'Soldadura', 'Mecanizado', 'Pintura'];
    expect(() => convertirEtapasDefault(incompleta)).toThrow(/etapas_default/);
  });

  it('rechaza un valor que no es una lista', () => {
    const noLista: Prisma.JsonValue = { etapas: etapasCanonicas };
    expect(() => convertirEtapasDefault(noLista)).toThrow(/etapas_default/);
  });
});
