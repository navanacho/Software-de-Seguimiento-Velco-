import { afterEach, describe, expect, it, vi } from 'vitest';
import type { FilaComparativaPorEtapa } from '../horas/comparativa.ts';
import { construirModeloPlanilla, type EntradaModeloPlanilla, type ModeloPlanilla } from './modelo.ts';

const comparativa: readonly FilaComparativaPorEtapa[] = [
  {
    etapaId: 'e-1',
    nombreEtapa: 'Corte',
    horasVendidas: '10.00',
    horasReales: '8.00',
    desvioHoras: '2.00',
    porcentajeConsumo: '80.00',
    alertaDesvio: false,
  },
];

const entrada: EntradaModeloPlanilla = {
  cliente: 'ACME',
  numeroOp: '1871',
  materiales: [
    { descripcion: 'Acero', cantidad: '2.0000', costoUnitarioCotizado: '9.00', costoUnitarioReal: '10.50' },
  ],
  horasVendidas: '10.00',
  horasReales: '8.00',
  valorHora: '12.50',
  montoVendido: '500.00',
  comparativa,
  incluirMargenes: false,
};

describe('C-11 modelo de planilla compartido', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('RN-EXPORT-03/05/06 construye la variante de costeo con derivados del dominio', () => {
    const modelo = construirModeloPlanilla({ ...entrada, incluirMargenes: true });
    expect(modelo.variante).toBe('costeo');
    if (modelo.variante !== 'costeo') return;
    expect(modelo).toMatchObject({
      cliente: 'ACME',
      numeroOp: '1871',
      horasVendidas: '10.00',
      horasReales: '8.00',
      valorHora: '12.50',
      comparativa,
    });
    expect(modelo.costos).toEqual({ costoMaterialesCotizado: '18.00', costoMaterialesReal: '21.00' });
    expect(modelo.margenReal).toBe('379.00');
  });

  it('RN-EXPORT-04/06 la variante operativa no contiene margen ni costos', () => {
    const modelo = construirModeloPlanilla({ ...entrada, incluirMargenes: false });
    expect(modelo.variante).toBe('operativa');
    expect(Object.hasOwn(modelo, 'margenReal')).toBe(false);
    expect(Object.hasOwn(modelo, 'costos')).toBe(false);
    expect(Object.hasOwn(modelo, 'montoVendido')).toBe(false);
    const [primerMaterial] = modelo.materiales;
    expect(primerMaterial).toBeDefined();
    expect(Object.keys(primerMaterial ?? {})).toEqual(['descripcion', 'cantidad']);
    expect(JSON.stringify(modelo)).not.toContain('costoUnitario');
    expect(modelo).toMatchObject({
      cliente: 'ACME',
      numeroOp: '1871',
      horasVendidas: '10.00',
      horasReales: '8.00',
      comparativa,
    });
  });

  it('RN-EXPORT-04/06 TRIANGULA sin materiales: ambas variantes quedan sin costos', () => {
    const sinMateriales: EntradaModeloPlanilla = { ...entrada, materiales: [] };
    const operativa = construirModeloPlanilla({ ...sinMateriales, incluirMargenes: false });
    expect(operativa.materiales).toEqual([]);
    expect(JSON.stringify(operativa)).not.toContain('costoUnitario');
    const costeo = construirModeloPlanilla({ ...sinMateriales, incluirMargenes: true });
    expect(costeo.variante).toBe('costeo');
    if (costeo.variante !== 'costeo') return;
    expect(costeo.materiales).toEqual([]);
    expect(costeo.costos).toEqual({ costoMaterialesCotizado: '0.00', costoMaterialesReal: '0.00' });
  });

  it('RN-EXPORT-04/06 TRIANGULA varios materiales solo en la variante de costeo', () => {
    const varios: EntradaModeloPlanilla = {
      ...entrada,
      materiales: [
        ...entrada.materiales,
        { descripcion: 'Cobre', cantidad: '3.0000', costoUnitarioCotizado: '4.00', costoUnitarioReal: '5.00' },
      ],
    };
    const operativa = construirModeloPlanilla({ ...varios, incluirMargenes: false });
    expect(operativa.materiales.map((material) => Object.keys(material))).toEqual([
      ['descripcion', 'cantidad'],
      ['descripcion', 'cantidad'],
    ]);
    expect(operativa.materiales.map((material) => material.descripcion)).toEqual(['Acero', 'Cobre']);
    expect(JSON.stringify(operativa)).not.toContain('costoUnitario');
    const costeo = construirModeloPlanilla({ ...varios, incluirMargenes: true });
    expect(costeo.variante).toBe('costeo');
    if (costeo.variante !== 'costeo') return;
    expect(Object.keys(costeo.materiales[0] ?? {})).toEqual([
      'descripcion',
      'cantidad',
      'costoUnitarioCotizado',
      'costoUnitarioReal',
    ]);
    expect(costeo.costos).toEqual({ costoMaterialesCotizado: '30.00', costoMaterialesReal: '36.00' });
    expect(costeo.margenReal).toBe('364.00');
  });

  it('DD-08 la unión discriminada sigue siendo exhaustiva en TypeScript', () => {
    const clavesPorVariante = (modelo: ModeloPlanilla): readonly string[] => {
      switch (modelo.variante) {
        case 'operativa':
          return Object.keys(modelo.materiales[0] ?? {});
        case 'costeo':
          return Object.keys(modelo.materiales[0] ?? {});
        default: {
          const exhaustivo: never = modelo;
          return exhaustivo;
        }
      }
    };
    expect(clavesPorVariante(construirModeloPlanilla({ ...entrada, incluirMargenes: false }))).toEqual([
      'descripcion',
      'cantidad',
    ]);
    expect(clavesPorVariante(construirModeloPlanilla({ ...entrada, incluirMargenes: true }))).toHaveLength(4);
  });

  it('RN-EXPORT-02 no depende de plantillas ni de EXCEL_TEMPLATES_DIR', () => {
    vi.stubEnv('EXCEL_TEMPLATES_DIR', 'C:\\no-existe\\plantillas');
    const conVariable = construirModeloPlanilla({ ...entrada, incluirMargenes: false });
    vi.stubEnv('EXCEL_TEMPLATES_DIR', '');
    const sinVariable = construirModeloPlanilla({ ...entrada, incluirMargenes: false });
    expect(conVariable).toEqual(sinVariable);
    expect(JSON.stringify(conVariable)).not.toContain('C:\\no-existe');
  });

  it('RN-EXPORT-06/DD-04 con tasa cero el costeo calcula margen y la operativa lo omite', () => {
    const sinMateriales: EntradaModeloPlanilla = {
      ...entrada,
      materiales: [],
      valorHora: '0.00',
      horasReales: '4.00',
      comparativa: [],
    };
    const costeo = construirModeloPlanilla({ ...sinMateriales, incluirMargenes: true });
    expect(costeo.variante).toBe('costeo');
    if (costeo.variante !== 'costeo') return;
    expect(costeo.costos).toEqual({ costoMaterialesCotizado: '0.00', costoMaterialesReal: '0.00' });
    expect(costeo.margenReal).toBe('500.00');
    const operativa = construirModeloPlanilla({ ...sinMateriales, incluirMargenes: false });
    expect(operativa.variante).toBe('operativa');
    expect(Object.hasOwn(operativa, 'margenReal')).toBe(false);
    expect(Object.hasOwn(operativa, 'costos')).toBe(false);
  });

  it('RN-EXPORT-06/DD-04 TRIANGULA tasa cero con materiales: calcula margen sin filtrar costos al costeo', () => {
    const tasaCero: EntradaModeloPlanilla = { ...entrada, valorHora: '0.00', horasReales: '4.00' };
    const costeo = construirModeloPlanilla({ ...tasaCero, incluirMargenes: true });
    expect(costeo.variante).toBe('costeo');
    if (costeo.variante !== 'costeo') return;
    expect(costeo.margenReal).toBe('479.00');
    expect(Object.keys(costeo.materiales[0] ?? {})).toEqual([
      'descripcion',
      'cantidad',
      'costoUnitarioCotizado',
      'costoUnitarioReal',
    ]);
    const operativa = construirModeloPlanilla({ ...tasaCero, incluirMargenes: false });
    expect(Object.keys(operativa.materiales[0] ?? {})).toEqual(['descripcion', 'cantidad']);
    expect(JSON.stringify(operativa)).not.toContain('costoUnitario');
    expect(Object.hasOwn(operativa, 'margenReal')).toBe(false);
  });

  it('DD-08 usa claves semánticas y conserva la comparativa recibida', () => {
    const modelo = construirModeloPlanilla({ ...entrada, incluirMargenes: false });
    expect(Object.keys(modelo)).toEqual([
      'cliente',
      'numeroOp',
      'materiales',
      'horasVendidas',
      'horasReales',
      'valorHora',
      'comparativa',
      'variante',
    ]);
    expect(modelo.comparativa).toBe(comparativa);
  });

  it('RN-MARGEN-06 la variante operativa oculta márgenes y costos', () => {
    const modelo = construirModeloPlanilla({ ...entrada, incluirMargenes: false });
    expect(modelo.variante).toBe('operativa');
    expect(Object.hasOwn(modelo, 'margenReal')).toBe(false);
    expect(Object.hasOwn(modelo, 'costos')).toBe(false);
    expect(Object.hasOwn(modelo, 'montoVendido')).toBe(false);
  });

  it('RN-MARGEN-06 TRIANGULA la variante costeo expone márgenes y costos', () => {
    const modelo = construirModeloPlanilla({ ...entrada, incluirMargenes: true });
    expect(modelo.variante).toBe('costeo');
    if (modelo.variante !== 'costeo') return;
    expect(modelo.margenReal).toBe('379.00');
    expect(modelo.costos).toEqual({ costoMaterialesCotizado: '18.00', costoMaterialesReal: '21.00' });
  });

  it('DD-11/IN-08 no incluye rangos de celda ni buffers', () => {
    const texto = JSON.stringify(construirModeloPlanilla({ ...entrada, incluirMargenes: true }));
    expect(texto).not.toContain('O7:R8');
    expect(texto).not.toContain('J7:N8');
    expect(texto).not.toContain('Buffer');
  });
});
