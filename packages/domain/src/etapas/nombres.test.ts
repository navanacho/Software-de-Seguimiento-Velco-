import { describe, expect, it } from 'vitest';
import { nombreEtapaDuplicado } from './nombres.ts';

describe('nombreEtapaDuplicado', () => {
  it('detecta duplicado case-insensitive', () => {
    expect(nombreEtapaDuplicado(['Corte', 'Soldadura'], 'soldadura')).toBe(true);
    expect(nombreEtapaDuplicado(['Corte', 'Soldadura'], 'Plegado')).toBe(false);
  });

  it('TRIANGULA: ignora espacios y vacío', () => {
    expect(nombreEtapaDuplicado([' Corte '], '  corte  ')).toBe(true);
    expect(nombreEtapaDuplicado([], 'Corte')).toBe(false);
  });
});
