import { describe, expect, it } from 'vitest';
import {
  calcularConsumoHoras,
  calcularDesvioHoras,
  calcularHorasRealesTotales,
  evaluarAlertaDesvio,
  validarRegistroHora,
} from './reglas.ts';

describe('C-08 RN-HORAS-05 validarRegistroHora', () => {
  it('acepta parte válido con etapa y observacion', () => {
    const resultado = validarRegistroHora({
      ordenId: 'op-1',
      etapaId: 'et-1',
      operario: 'Juan',
      fecha: '2026-11-20',
      horas: '2.50',
      observacion: 'Revisar tornillería',
    });
    expect(resultado.ok).toBe(true);
  });

  it('acepta parte válido sin etapa ni observacion', () => {
    const resultado = validarRegistroHora({
      ordenId: 'op-1',
      etapaId: null,
      operario: 'Ana',
      fecha: '2026-11-20',
      horas: '1.00',
    });
    expect(resultado.ok).toBe(true);
  });

  it('RN-HORAS-05 rechaza horas cero', () => {
    const resultado = validarRegistroHora({
      ordenId: 'op-1',
      etapaId: null,
      operario: 'Ana',
      fecha: '2026-11-20',
      horas: '0.00',
    });
    expect(resultado.ok).toBe(false);
  });

  it('RN-HORAS-05 rechaza horas negativas y operario vacío', () => {
    expect(
      validarRegistroHora({ ordenId: 'op-1', etapaId: null, operario: 'Ana', fecha: '2026-11-20', horas: '-1.00' }).ok,
    ).toBe(false);
    expect(
      validarRegistroHora({ ordenId: 'op-1', etapaId: null, operario: '  ', fecha: '2026-11-20', horas: '1.00' }).ok,
    ).toBe(false);
  });
});

describe('C-08 RN-HORAS-01 calcularHorasRealesTotales', () => {
  it('suma exacta de tres partes', () => {
    expect(calcularHorasRealesTotales(['2.50', '1.25', '0.75'])).toBe('4.50');
  });

  it('lista vacía devuelve 0.00 y preserva dos decimales', () => {
    expect(calcularHorasRealesTotales([])).toBe('0.00');
    expect(calcularHorasRealesTotales(['0.10', '0.20'])).toBe('0.30');
  });
});

describe('C-08 RN-HORAS-02 calcularDesvioHoras', () => {
  it('desvío positivo cuando reales menores que vendidas', () => {
    expect(calcularDesvioHoras(['4.00'], ['3.00'])).toBe('1.00');
  });

  it('desvío negativo y sin partes', () => {
    expect(calcularDesvioHoras(['4.00'], ['5.00'])).toBe('-1.00');
    expect(calcularDesvioHoras(['4.00', '2.00'], [])).toBe('6.00');
  });
});

describe('C-08 RN-HORAS-03/06 calcularConsumoHoras', () => {
  it('calcula consumo exacto', () => {
    expect(calcularConsumoHoras('3.75', '4.00')).toBe('93.75');
  });

  it('RN-HORAS-06 devuelve null cuando vendidas es 0', () => {
    expect(calcularConsumoHoras('1.00', '0.00')).toBeNull();
  });
});

describe('C-08 RN-HORAS-04 evaluarAlertaDesvio', () => {
  it('RN-HORAS-04 activa alerta cuando consumo supera avance + 15', () => {
    expect(evaluarAlertaDesvio({ consumo: '95.01', avance: 80, horasReales: '3.80', horasVendidas: '4.00' })).toBe(true);
  });

  it('RN-HORAS-04 no activa en el límite exacto ni debajo', () => {
    expect(evaluarAlertaDesvio({ consumo: '95.00', avance: 80, horasReales: '3.80', horasVendidas: '4.00' })).toBe(false);
    expect(evaluarAlertaDesvio({ consumo: '93.75', avance: 80, horasReales: '3.75', horasVendidas: '4.00' })).toBe(false);
  });

  it('RN-HORAS-06 activa por exceso cuando vendidas es 0', () => {
    expect(evaluarAlertaDesvio({ consumo: null, avance: 0, horasReales: '1.00', horasVendidas: '0.00' })).toBe(true);
  });

  it('activa por exceso aunque fecha lejana (sin fechas)', () => {
    expect(evaluarAlertaDesvio({ consumo: '120.00', avance: 10, horasReales: '6.00', horasVendidas: '5.00' })).toBe(true);
  });
});
