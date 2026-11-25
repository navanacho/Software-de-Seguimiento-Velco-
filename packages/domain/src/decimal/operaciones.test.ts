import { describe, expect, it } from 'vitest';
import { calcularConsumoHoras } from '../horas/reglas.ts';
import { comparar, desdeCadena, multiplicar, restar, sumar } from './operaciones.ts';

describe('C-11 decimal exacto RN-MARGEN-05', () => {
  it('suma y resta centésimas sin coma flotante', () => {
    expect(sumar('0.10', '0.20')).toBe('0.30');
    expect(restar('1000.00', '33.75')).toBe('966.25');
  });

  it('multiplica con escala exacta sin redondeo comercial', () => {
    expect(multiplicar('3.25', '10.10')).toBe('32.8250');
    expect(multiplicar('1.2345', '10.00')).toBe('12.3450');
  });

  it('compara valores con distinta cantidad de decimales', () => {
    expect(comparar('0.1', '0.10000')).toBe(0);
    expect(comparar('-1.01', '0.00')).toBe(-1);
    expect(comparar('10.01', '10.00')).toBe(1);
  });

  it('normaliza ceros a la derecha sin perder precisión', () => {
    expect(desdeCadena('0')).toBe('0.00');
    expect(desdeCadena('1.2300')).toBe('1.23');
  });

  it('opera más allá de la precisión de number', () => {
    expect(sumar('9007199254740993.00', '0.01')).toBe('9007199254740993.01');
  });

  it('maneja negativos, cero y signos sin perder el cero', () => {
    expect(sumar('-1.25', '0.25')).toBe('-1.00');
    expect(restar('0.00', '0.01')).toBe('-0.01');
    expect(multiplicar('-2.00', '3.50')).toBe('-7.0000');
    expect(sumar('0.00', '0.00')).toBe('0.00');
  });

  it('no descarta dígitos significativos al desbordar la escala', () => {
    expect(sumar('0.01', '0.0009')).toBe('0.0109');
    expect(restar('1.2345', '0.0001')).toBe('1.2344');
    expect(multiplicar('1.23456', '2.00000')).toBe('2.46912');
    expect(comparar('1.2300', '1.23')).toBe(0);
  });
});

describe('C-11 RN-HORAS-03 reutiliza el consumo de C-08', () => {
  it('conserva dos decimales en una división no terminada', () => {
    expect(calcularConsumoHoras('1.00', '3.00')).toBe('33.33');
    expect(calcularConsumoHoras('2.00', '3.00')).toBe('66.66');
    expect(calcularConsumoHoras('7.00', '9.00')).toBe('77.77');
  });
});
