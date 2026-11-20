import { describe, expect, it } from 'vitest';
import { crearEtapa, crearEtapas } from '../testing/fixtures.ts';
import { etapaAhora } from './etapa-ahora.ts';

describe('etapaAhora', () => {
  it('RN-AHORA-01: con secuencias 1, 2 y 3 y la 1 completada devuelve la secuencia 2', () => {
    const etapas = crearEtapas(['Corte', 'Soldadura', 'Mecanizado'], 1);
    expect(etapaAhora(etapas)).toEqual(etapas[1]);
  });

  it('RN-AHORA-01: con el arreglo desordenado 3, 1 y 2 devuelve la secuencia 2', () => {
    const tercera = crearEtapa({ id: 'e3', nombre: 'Mecanizado', ordenSecuencia: 3 });
    const primera = crearEtapa({ id: 'e1', nombre: 'Corte', ordenSecuencia: 1, completada: true });
    const segunda = crearEtapa({ id: 'e2', nombre: 'Soldadura', ordenSecuencia: 2 });
    expect(etapaAhora([tercera, primera, segunda])).toMatchObject({
      nombre: 'Soldadura',
      ordenSecuencia: 2,
    });
  });

  it('RN-AHORA-01: todas completadas devuelve Todo listo', () => {
    expect(etapaAhora(crearEtapas(['Corte', 'Pintura'], 2))).toBe('Todo listo');
  });
});
