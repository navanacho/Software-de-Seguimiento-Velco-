import { describe, expect, it } from 'vitest';
import { formatearImporte, formatearPorcentaje } from './formatoDecimal.ts';

describe('formatoDecimal de presentación (3.1)', () => {
  it('redondea hacia arriba el tercer decimal conservando dos cifras', () => {
    expect(formatearImporte('12.3450')).toBe('12.35');
  });

  it('conserva el signo al redondear un importe negativo', () => {
    expect(formatearImporte('-33.7500')).toBe('-33.75');
  });

  it('recorta ceros finales en el porcentaje', () => {
    expect(formatearPorcentaje('80.00')).toBe('80%');
  });

  it('muestra guion cuando el consumo es nulo', () => {
    expect(formatearPorcentaje(null)).toBe('—');
  });
});

describe('formatoDecimal con acarreo (3.3)', () => {
  it('propaga el acarreo desde los decimales hasta la parte entera', () => {
    expect(formatearImporte('9.999')).toBe('10.00');
  });

  it('redondea el caso límite de medio centavo', () => {
    expect(formatearImporte('0.005')).toBe('0.01');
  });

  it('conserva los decimales significativos del porcentaje', () => {
    expect(formatearPorcentaje('95.01')).toBe('95.01%');
  });
});
