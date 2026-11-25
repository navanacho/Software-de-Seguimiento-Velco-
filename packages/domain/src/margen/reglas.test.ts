import { describe, expect, it } from 'vitest';
import type { MaterialParaAgregado } from '../materiales/agregados.ts';
import { costoMaterialReal, costoMaterialesCotizado, margenReal, tasaGlobalNoConfigurada } from './reglas.ts';

const materiales: readonly MaterialParaAgregado[] = [
  { cantidad: '2.0000', costoUnitarioCotizado: '9.00', costoUnitarioReal: '10.50' },
  { cantidad: '3.0000', costoUnitarioCotizado: '4.25', costoUnitarioReal: null },
];

describe('C-11 costos de materiales y margen real', () => {
  it('RN-MARGEN-02 aplica COALESCE por ítem y suma exacta', () => {
    expect(costoMaterialReal(materiales)).toBe('33.75');
  });

  it('RN-MARGEN-01 calcula margen positivo con tasa inyectada', () => {
    expect(margenReal({
      montoVendido: '1000.00',
      horasRealesTotales: '40.00',
      costoMaterialesReal: '100.00',
      valorHoraEstandar: '12.50',
    })).toBe('400.00');
  });

  it('RN-MARGEN-01 conserva el margen negativo', () => {
    expect(margenReal({
      montoVendido: '500.00',
      horasRealesTotales: '40.00',
      costoMaterialesReal: '33.75',
      valorHoraEstandar: '12.50',
    })).toBe('-33.75');
  });

  it('RN-CONFIG-01 con tasa cero no devuelve null y advierte', () => {
    expect(margenReal({
      montoVendido: '1000.00',
      horasRealesTotales: '40.00',
      costoMaterialesReal: '100.00',
      valorHoraEstandar: '0.00',
    })).toBe('900.00');
    expect(tasaGlobalNoConfigurada('0.00')).toBe(true);
    expect(tasaGlobalNoConfigurada('12.50')).toBe(false);
  });

  it('RN-MARGEN-05 no redondea el producto exacto al calcular el margen', () => {
    expect(margenReal({
      montoVendido: '100.00',
      horasRealesTotales: '3.25',
      costoMaterialesReal: '0.00',
      valorHoraEstandar: '10.10',
    })).toBe('67.1750');
  });

  it('RN-MARGEN-04 valora la mano de obra con una sola tasa global inyectada', () => {
    const base = {
      montoVendido: '1000.00',
      horasRealesTotales: '10.00',
      costoMaterialesReal: '100.00',
    };
    expect(margenReal({ ...base, valorHoraEstandar: '10.00' })).toBe('800.00');
    expect(margenReal({ ...base, valorHoraEstandar: '20.00' })).toBe('700.00');
  });

  it('RN-MARGEN-04 TRIANGULA conserva la tasa global sin materiales', () => {
    expect(margenReal({
      montoVendido: '500.00',
      horasRealesTotales: '2.00',
      costoMaterialesReal: costoMaterialReal([]),
      valorHoraEstandar: '25.00',
    })).toBe('450.00');
    expect(tasaGlobalNoConfigurada('25.00')).toBe(false);
  });

  it('RN-MARGEN-05 TRIANGULA conserva cuatro decimales con otra tasa', () => {
    expect(margenReal({
      montoVendido: '100.00',
      horasRealesTotales: '0.25',
      costoMaterialesReal: '0.00',
      valorHoraEstandar: '10.10',
    })).toBe('97.4750');
  });

  it('RN-MARGEN-03 usa la tasa vigente inyectada sin leerla de una fuente oculta', () => {
    const base = {
      montoVendido: '5000.00',
      horasRealesTotales: '1.00',
      costoMaterialesReal: '100.00',
    };
    expect(margenReal({ ...base, valorHoraEstandar: '2000.00' })).toBe('2900.00');
    expect(margenReal({ ...base, valorHoraEstandar: '12.50' })).toBe('4887.50');
  });

  it('RN-MARGEN-02 y RN-MARGEN-03 sin materiales y con todos los reales nulos', () => {
    expect(costoMaterialReal([])).toBe('0.00');
    expect(costoMaterialesCotizado([])).toBe('0.00');
    const soloCotizados: readonly MaterialParaAgregado[] = [
      { cantidad: '1.00', costoUnitarioCotizado: '5.50', costoUnitarioReal: null },
      { cantidad: '2.00', costoUnitarioCotizado: '3.00', costoUnitarioReal: null },
    ];
    expect(costoMaterialReal(soloCotizados)).toBe('11.50');
    expect(costoMaterialesCotizado(soloCotizados)).toBe('11.50');
  });

  it('SU-02 conserva cuatro decimales en cantidades sin conversión a coma flotante', () => {
    expect(costoMaterialesCotizado([
      { cantidad: '1.2345', costoUnitarioCotizado: '10.00', costoUnitarioReal: null },
    ])).toBe('12.3450');
  });

  it('RN-CONFIG-01 reitera la advertencia con otra tasa cero y monto distinto', () => {
    expect(margenReal({
      montoVendido: '50.00',
      horasRealesTotales: '2.00',
      costoMaterialesReal: '5.00',
      valorHoraEstandar: '0.0000',
    })).toBe('45.00');
    expect(tasaGlobalNoConfigurada('0.0000')).toBe(true);
  });
});
