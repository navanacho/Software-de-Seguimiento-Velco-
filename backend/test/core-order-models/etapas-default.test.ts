import type { Prisma } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { convertirEtapasDefault } from '../../src/features/configuracion/prisma/etapas-default.ts';

const etapasCanonicas: Prisma.JsonValue = ['Corte', 'Soldadura', 'Mecanizado', 'Pintura', 'Entrega'];

describe('convertirEtapasDefault', () => {
  it('devuelve la lista canónica como readonly string[]', () => {
    expect(convertirEtapasDefault(etapasCanonicas)).toEqual([
      'Corte',
      'Soldadura',
      'Mecanizado',
      'Pintura',
      'Entrega',
    ]);
  });

  it('TRIANGULA: devuelve una plantilla no canónica en el mismo orden', () => {
    const propia: Prisma.JsonValue = ['Corte', 'Plegado', 'Control', 'Entrega'];
    expect(convertirEtapasDefault(propia)).toEqual(['Corte', 'Plegado', 'Control', 'Entrega']);
  });

  it('rechaza un valor que no es una lista', () => {
    const noLista: Prisma.JsonValue = { etapas: etapasCanonicas };
    expect(() => convertirEtapasDefault(noLista)).toThrow(/etapas_default/);
  });

  it('TRIANGULA: rechaza plantilla vacía y nombres duplicados', () => {
    expect(() => convertirEtapasDefault([])).toThrow(/etapas_default/);
    expect(() => convertirEtapasDefault(['Corte', 'CORTE'])).toThrow(/etapas_default/);
  });
});
