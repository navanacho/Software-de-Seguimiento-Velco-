import { describe, expect, it } from 'vitest';
import { calcularHorasVendidasTotales } from './horas-vendidas.ts';

describe('calcularHorasVendidasTotales', () => {
  it('6.6 suma horas vendidas como decimal exacto', () => {
    expect(calcularHorasVendidasTotales(['4.00', '6.00', '0.00'])).toBe('10.00');
    expect(calcularHorasVendidasTotales(['1.50', '2.25'])).toBe('3.75');
  });

  it('6.8 TRIANGULA: vacío da 0.00 y preserva centésimas', () => {
    expect(calcularHorasVendidasTotales([])).toBe('0.00');
    expect(calcularHorasVendidasTotales(['0.10', '0.20'])).toBe('0.30');
  });
});
