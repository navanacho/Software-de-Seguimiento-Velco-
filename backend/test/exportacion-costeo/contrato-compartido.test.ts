import { construirModeloPlanilla, type EntradaModeloPlanilla } from '@velco/domain';
import { describe, expect, it } from 'vitest';
import { esModeloCompartido, mapearModeloACeldas } from '../../src/features/exportacion/excel/mapeo';

function entradaBase(): EntradaModeloPlanilla {
  return {
    cliente: 'ACME S.A.',
    numeroOp: 'OP-2026-001',
    materiales: [
      {
        tipo: 'MP',
        descripcion: 'Acero',
        cantidad: '2.0000',
        unidad: 'kg',
        costoUnitarioCotizado: '32.8250',
        costoUnitarioReal: '50.0000',
      },
    ],
    horasVendidas: '10.00',
    horasReales: '8.00',
    valorHora: '32.8250',
    montoVendido: '1000.00',
    comparativa: [
      {
        etapaId: 'e1',
        nombreEtapa: 'Desarme',
        horasVendidas: '4.00',
        horasReales: '3.00',
        desvioHoras: '-1.00',
        porcentajeConsumo: '75.00',
        alertaDesvio: false,
      },
    ],
    incluirMargenes: true,
  };
}

describe('contrato compartido C-14/C-15', () => {
  it('2.7 acepta las dos variantes construidas por el único constructor', () => {
    expect(esModeloCompartido(construirModeloPlanilla(entradaBase()))).toBe(true);
    expect(esModeloCompartido(construirModeloPlanilla({ ...entradaBase(), incluirMargenes: false }))).toBe(true);
  });

  it('2.7 rechaza un segundo constructor que filtra márgenes en la variante operativa', () => {
    const operativa = construirModeloPlanilla({ ...entradaBase(), incluirMargenes: false });
    const simulacro = { ...operativa, margenReal: '607.40' };
    expect(esModeloCompartido(simulacro)).toBe(false);
    expect(() => mapearModeloACeldas(simulacro as typeof operativa)).not.toThrow();
  });

  it('2.8 rechaza costeo sin costos, material con importes en operativa y claves de C-15', () => {
    const costeo = construirModeloPlanilla(entradaBase());
    const operativa = construirModeloPlanilla({ ...entradaBase(), incluirMargenes: false });
    expect(esModeloCompartido({ ...costeo, costos: undefined })).toBe(false);
    expect(
      esModeloCompartido({
        ...operativa,
        materiales: [{ descripcion: 'MP', cantidad: '1.0000', costoUnitarioCotizado: '1.00' }],
      }),
    ).toBe(false);
    expect(esModeloCompartido({ ...operativa, codigo_plano: 'ID-1' })).toBe(false);
    expect(esModeloCompartido({ ...operativa, O7: 'S/P' })).toBe(false);
    expect(esModeloCompartido(null)).toBe(false);
    expect(esModeloCompartido('modelo')).toBe(false);
  });

  it('2.8 la variante operativa no expone claves de margen ni de costos', () => {
    const mapa = mapearModeloACeldas(construirModeloPlanilla({ ...entradaBase(), incluirMargenes: false }));
    expect(Object.keys(mapa).some((clave) => clave.includes('margen'))).toBe(false);
    expect(Object.keys(mapa).some((clave) => clave.includes('costos'))).toBe(false);
    expect(mapa['materiales.0.descripcion']).toBe('[MP] Acero');
    expect(mapa['materiales.0.cantidad']).toBe('2.0000');
  });
});
