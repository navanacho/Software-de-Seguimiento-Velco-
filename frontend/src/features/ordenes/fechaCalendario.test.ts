import { afterEach, describe, expect, it, vi } from 'vitest';
import { fechaCalendario, fechaHoy } from './fechaCalendario.ts';

afterEach(() => {
  vi.useRealTimers();
});

describe('fechaCalendario (C-09, frontera UI)', () => {
  it('formatea una fecha local como día calendario', () => {
    expect(fechaCalendario(new Date(2026, 10, 24, 23, 30))).toBe('2026-11-24');
  });

  it('rellena con ceros el mes y el día en otra fecha', () => {
    expect(fechaCalendario(new Date(2027, 0, 3, 0, 5))).toBe('2027-01-03');
  });

  it('fechaHoy usa el reloj simulado sin depender de la hora real', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 24, 23, 59));
    expect(fechaHoy()).toBe('2026-11-24');
  });
});
