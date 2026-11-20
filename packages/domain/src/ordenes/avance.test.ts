import { describe, expect, it } from 'vitest';
import { crearEtapas } from '../testing/fixtures.ts';
import { calcularAvance } from './avance.ts';

describe('calcularAvance', () => {
  it('RN-AVANCE-01: 5 etapas con 2 completadas da avance 40', () => {
    expect(calcularAvance(crearEtapas(['Corte', 'Soldadura', 'Mecanizado', 'Pintura', 'Entrega'], 2))).toBe(40);
  });

  it('RN-AVANCE-02: todas las etapas completadas da avance 100', () => {
    expect(calcularAvance(crearEtapas(['Corte', 'Soldadura'], 2))).toBe(100);
  });

  it('RN-GLOBAL-03: una OP sin etapas da avance 0 sin lanzar', () => {
    expect(calcularAvance([])).toBe(0);
  });

  it('RN-AVANCE-01: 1 de 3 etapas se redondea a 33', () => {
    expect(calcularAvance(crearEtapas(['Corte', 'Soldadura', 'Pintura'], 1))).toBe(33);
  });
});
