import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatearCantidad, formatearImporte } from '../../src/features/exportacion/excel/mapeo';

describe('frontera decimal de exportacion-costeo', () => {
  it('2.4 aplica HALF_UP con escala 2 a importes positivos', () => {
    expect(formatearImporte('32.8250')).toBe('32.83');
    expect(formatearImporte('32.8249')).toBe('32.82');
    expect(formatearImporte('0.005')).toBe('0.01');
  });

  it('2.5 aplica HALF_UP simétrico a importes negativos', () => {
    expect(formatearImporte('-33.75')).toBe('-33.75');
    expect(formatearImporte('-33.7550')).toBe('-33.76');
    expect(formatearImporte('-33.7549')).toBe('-33.75');
    expect(formatearImporte('-0.005')).toBe('-0.01');
  });

  it('2.6 preserva hasta 4 decimales en cantidades y redondea el exceso', () => {
    expect(formatearCantidad('1.2345')).toBe('1.2345');
    expect(formatearCantidad('1.2')).toBe('1.2000');
    expect(formatearCantidad('1.23455')).toBe('1.2346');
    expect(formatearCantidad('-1.23455')).toBe('-1.2346');
  });

  it('2.4 rechaza decimales inválidos en lugar de silenciarlos', () => {
    expect(() => formatearImporte('abc')).toThrow('decimal inválido');
    expect(() => formatearCantidad('1.')).toThrow('decimal inválido');
  });

  it('2.6 el adaptador no usa coma flotante ni enteros nativos', () => {
    const fuente = readFileSync(
      join(resolve(process.cwd(), '..'), 'backend', 'src', 'features', 'exportacion', 'excel', 'mapeo.ts'),
      'utf8',
    );
    expect(fuente).not.toMatch(/parseFloat|toNumber|Math\.round|toFixed/);
    expect(fuente).not.toMatch(/\bnumber\b/);
    expect(fuente).not.toMatch(/\bany\b/);
  });
});
