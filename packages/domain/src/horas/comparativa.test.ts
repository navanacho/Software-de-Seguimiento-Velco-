import { describe, expect, it } from 'vitest';
import { comparativaPorEtapa } from './comparativa.ts';

describe('C-11 comparativa por etapa', () => {
  it('RN-HORAS-01, RN-HORAS-02 y RN-HORAS-03 calcula por etapa con las reglas de C-08', () => {
    const filas = comparativaPorEtapa({
      etapas: [
        { id: 'e-1', nombre: 'Corte', horasVendidas: '40.00' },
        { id: 'e-2', nombre: 'Soldadura', horasVendidas: '20.00' },
      ],
      partes: [
        { etapaId: 'e-1', horas: '36.00' },
        { etapaId: 'e-2', horas: '22.00' },
      ],
      avance: 80,
    });
    expect(filas).toEqual([
      {
        etapaId: 'e-1',
        nombreEtapa: 'Corte',
        horasVendidas: '40.00',
        horasReales: '36.00',
        desvioHoras: '4.00',
        porcentajeConsumo: '90.00',
        alertaDesvio: false,
      },
      {
        etapaId: 'e-2',
        nombreEtapa: 'Soldadura',
        horasVendidas: '20.00',
        horasReales: '22.00',
        desvioHoras: '-2.00',
        porcentajeConsumo: '110.00',
        alertaDesvio: true,
      },
    ]);
  });

  it('RN-HORAS-05 y RN-HORAS-07 consolida las horas sin etapa en la última fila', () => {
    const filas = comparativaPorEtapa({
      etapas: [{ id: 'e-1', nombre: 'Corte', horasVendidas: '10.00' }],
      partes: [
        { etapaId: 'e-1', horas: '8.00' },
        { etapaId: null, horas: '1.25' },
        { etapaId: null, horas: '0.75' },
      ],
      avance: 10,
    });
    expect(filas).toHaveLength(2);
    expect(filas[1]).toMatchObject({
      etapaId: null,
      nombreEtapa: 'Sin etapa',
      horasVendidas: '0.00',
      horasReales: '2.00',
      desvioHoras: '-2.00',
      porcentajeConsumo: null,
      alertaDesvio: true,
    });
  });

  it('RN-HORAS-02 y RN-HORAS-03 invierte el desvío y supera el 100% cuando reales exceden vendidas', () => {
    const filas = comparativaPorEtapa({
      etapas: [{ id: 'e-1', nombre: 'Corte', horasVendidas: '8.00' }],
      partes: [{ etapaId: 'e-1', horas: '10.00' }],
      avance: 10,
    });
    expect(filas[0]).toMatchObject({
      desvioHoras: '-2.00',
      porcentajeConsumo: '125.00',
      alertaDesvio: true,
    });
  });

  it('RN-HORAS-04 activa alerta por exceso de reales aunque el avance sea alto', () => {
    const filas = comparativaPorEtapa({
      etapas: [{ id: 'e-1', nombre: 'Corte', horasVendidas: '10.00' }],
      partes: [{ etapaId: 'e-1', horas: '10.01' }],
      avance: 100,
    });
    expect(filas[0]).toMatchObject({ porcentajeConsumo: '100.10', alertaDesvio: true });
  });

  it('RN-HORAS-07 mantiene la etapa sin partes y su desvío igual a las vendidas', () => {
    const filas = comparativaPorEtapa({
      etapas: [{ id: 'e-1', nombre: 'Corte', horasVendidas: '3.50' }],
      partes: [],
      avance: 0,
    });
    expect(filas).toEqual([
      {
        etapaId: 'e-1',
        nombreEtapa: 'Corte',
        horasVendidas: '3.50',
        horasReales: '0.00',
        desvioHoras: '3.50',
        porcentajeConsumo: '0.00',
        alertaDesvio: false,
      },
    ]);
  });

  it('RN-GLOBAL-03 sin etapas ni partes devuelve una colección vacía', () => {
    expect(comparativaPorEtapa({ etapas: [], partes: [], avance: 0 })).toEqual([]);
  });

  it('RN-HORAS-06 vendidas cero con reales activa alerta sin dividir', () => {
    const filas = comparativaPorEtapa({
      etapas: [{ id: 'e-1', nombre: 'Corte', horasVendidas: '0.00' }],
      partes: [{ etapaId: 'e-1', horas: '1.00' }],
      avance: 0,
    });
    expect(filas[0]).toMatchObject({ porcentajeConsumo: null, alertaDesvio: true });
  });

  it('RN-HORAS-06 vendidas cero sin reales no alerta', () => {
    const filas = comparativaPorEtapa({
      etapas: [{ id: 'e-1', nombre: 'Corte', horasVendidas: '0.00' }],
      partes: [],
      avance: 0,
    });
    expect(filas[0]).toMatchObject({ porcentajeConsumo: null, alertaDesvio: false });
  });

  it('RN-HORAS-04 aplica el umbral fijo de 15 con comparación estricta', () => {
    const construir = (horas: string) => comparativaPorEtapa({
      etapas: [{ id: 'e-1', nombre: 'Corte', horasVendidas: '100.00' }],
      partes: [{ etapaId: 'e-1', horas }],
      avance: 80,
    })[0];
    expect(construir('96.00')).toMatchObject({ porcentajeConsumo: '96.00', alertaDesvio: true });
    expect(construir('95.00')).toMatchObject({ porcentajeConsumo: '95.00', alertaDesvio: false });
    expect(construir('94.99')).toMatchObject({ porcentajeConsumo: '94.99', alertaDesvio: false });
  });

  it('RN-HORAS-01 suma varios partes de una etapa y mantiene el bucket sin etapa al final', () => {
    const filas = comparativaPorEtapa({
      etapas: [
        { id: 'e-1', nombre: 'Corte', horasVendidas: '10.00' },
        { id: 'e-2', nombre: 'Pintura', horasVendidas: '5.00' },
      ],
      partes: [
        { etapaId: null, horas: '0.50' },
        { etapaId: 'e-1', horas: '2.00' },
        { etapaId: 'e-1', horas: '3.00' },
        { etapaId: 'e-2', horas: '6.00' },
      ],
      avance: 10,
    });
    expect(filas.map((fila) => fila.nombreEtapa)).toEqual(['Corte', 'Pintura', 'Sin etapa']);
    expect(filas[0]).toMatchObject({ horasReales: '5.00', desvioHoras: '5.00', porcentajeConsumo: '50.00' });
    expect(filas[1]).toMatchObject({ horasReales: '6.00', desvioHoras: '-1.00', alertaDesvio: true });
    expect(filas[2]).toMatchObject({ horasReales: '0.50', desvioHoras: '-0.50', porcentajeConsumo: null });
  });
});
