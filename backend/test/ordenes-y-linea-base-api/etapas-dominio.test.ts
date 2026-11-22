import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { nombreEtapaDuplicado } from '@velco/domain';

describe('unicidad nombres etapa', () => {
  it('6.1 detecta duplicado case-insensitive en misma OP', () => {
    expect(nombreEtapaDuplicado(['Corte', 'Soldadura'], 'soldadura')).toBe(true);
    expect(nombreEtapaDuplicado(['Corte', 'Soldadura'], 'Plegado')).toBe(false);
  });

  it('6.3 TRIANGULA: ignora espacios y compara normalizado', () => {
    expect(nombreEtapaDuplicado([' Corte '], 'corte')).toBe(true);
    expect(nombreEtapaDuplicado([], 'Corte')).toBe(false);
  });
});

describe('guardian R2 createOp', () => {
  it('6.9 createOp no importa Prisma/Fastify', () => {
    const src = readFileSync(new URL('../../src/features/ordenes/application/createOp.ts', import.meta.url), 'utf8');
    expect(src).not.toMatch(/@prisma\/client|fastify/i);
  });
});
