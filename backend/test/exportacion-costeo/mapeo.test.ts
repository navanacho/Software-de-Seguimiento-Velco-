import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { construirModeloPlanilla, type EntradaModeloPlanilla } from '@velco/domain';
import { describe, expect, it } from 'vitest';
import { mapearModeloACeldas } from '../../src/features/exportacion/excel/mapeo';

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
      {
        tipo: 'INSUMOS',
        descripcion: 'Pintura',
        cantidad: '1.2345',
        unidad: null,
        costoUnitarioCotizado: '0.0000',
        costoUnitarioReal: null,
      },
      {
        tipo: 'TERCERIZADOS',
        descripcion: 'Rectificado',
        cantidad: '3.0000',
        unidad: 'UN',
        costoUnitarioCotizado: '10.0000',
        costoUnitarioReal: null,
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
      {
        etapaId: null,
        nombreEtapa: 'Sin etapa',
        horasVendidas: '6.00',
        horasReales: '5.00',
        desvioHoras: '-1.00',
        porcentajeConsumo: null,
        alertaDesvio: true,
      },
    ],
    incluirMargenes: true,
  };
}

describe('MAP semántico de exportacion-costeo', () => {
  it('2.1 es determinista y no depende de I/O', () => {
    const modelo = construirModeloPlanilla(entradaBase());
    expect(mapearModeloACeldas(modelo)).toEqual(mapearModeloACeldas(modelo));
  });

  it('2.2 conserva cliente, OP y horas como claves semánticas, sin direcciones de celda', () => {
    const mapa = mapearModeloACeldas(construirModeloPlanilla(entradaBase()));
    expect(mapa.cliente).toBe('ACME S.A.');
    expect(mapa.numeroOp).toBe('OP-2026-001');
    expect(mapa.horasVendidas).toBe('10.00');
    expect(mapa.horasReales).toBe('8.00');
    expect(mapa.valorHora).toBe('32.83');
    expect(Object.keys(mapa).some((clave) => /`?\b[A-Z]{1,2}\d{1,3}\b`?/.test(clave))).toBe(false);
  });

  it('2.3 traduce MP, INSUMOS y TERCERIZADOS sin inventar unidad ni costo total', () => {
    const mapa = mapearModeloACeldas(construirModeloPlanilla(entradaBase()));
    expect(mapa['materiales.0.descripcion']).toBe('[MP] Acero');
    expect(mapa['materiales.0.cantidad']).toBe('2.0000');
    expect(mapa['materiales.0.un']).toBe('kg');
    expect(mapa['materiales.0.costoUnitarioCotizado']).toBe('32.83');
    expect(mapa['materiales.0.costoUnitarioReal']).toBe('50.00');
    expect(mapa['materiales.0.costoUnitario']).toBe('50.00');
    expect(mapa['materiales.1.descripcion']).toBe('[INSUMOS] Pintura');
    expect(mapa['materiales.1.cantidad']).toBe('1.2345');
    expect(mapa['materiales.1.un']).toBe('');
    expect(mapa['materiales.1.costoUnitarioReal']).toBe('');
    expect(mapa['materiales.1.costoUnitario']).toBe('0.00');
    expect(mapa['materiales.2.descripcion']).toBe('[TERCERIZADOS] Rectificado');
    expect(mapa['materiales.2.un']).toBe('UN');
    expect(mapa['materiales.2.costoUnitarioCotizado']).toBe('10.00');
    expect(mapa['materiales.2.costoUnitario']).toBe('10.00');
    expect(mapa['materiales.0.costoTotal']).toBe('100.00');
    expect(mapa['materiales.1.costoTotal']).toBe('0.00');
    expect(mapa['materiales.2.costoTotal']).toBe('30.00');
  });

  it('2.6 TRIANGULATE redondea el costo total exacto solo en la celda, con HALF_UP', () => {
    const entrada = {
      ...entradaBase(),
      materiales: [
        {
          tipo: 'MP' as const,
          descripcion: 'Resina',
          cantidad: '1.0000',
          unidad: 'kg',
          costoUnitarioCotizado: '2.3450',
          costoUnitarioReal: null,
        },
      ],
    };
    const modelo = construirModeloPlanilla(entrada);
    if (modelo.variante !== 'costeo') throw new Error('el modelo no es de costeo');
    const mapa = mapearModeloACeldas(modelo);

    expect(modelo.materiales[0]?.costoUnitarioCotizado).toBe('2.3450');
    expect(mapa['materiales.0.costoTotal']).toBe('2.35');
  });

  it('2.3 sin materiales no emite claves de materiales', () => {
    const mapa = mapearModeloACeldas(construirModeloPlanilla({ ...entradaBase(), materiales: [] }));
    expect(Object.keys(mapa).some((clave) => clave.startsWith('materiales.'))).toBe(false);
    expect(mapa['costos.costoMaterialesReal']).toBe('0.00');
    expect(mapa.margenReal).toBe('737.40');
  });

  it('2.3 traduce la comparativa por etapa y el margen agregado', () => {
    const mapa = mapearModeloACeldas(construirModeloPlanilla(entradaBase()));
    expect(mapa['comparativa.0.etapa']).toBe('Desarme');
    expect(mapa['comparativa.0.horasVendidas']).toBe('4.00');
    expect(mapa['comparativa.0.horasReales']).toBe('3.00');
    expect(mapa['comparativa.0.desvioHoras']).toBe('-1.00');
    expect(mapa['comparativa.0.porcentajeConsumo']).toBe('75.00');
    expect(mapa['comparativa.0.alertaDesvio']).toBe('NO');
    expect(mapa['comparativa.1.etapa']).toBe('Sin etapa');
    expect(mapa['comparativa.1.porcentajeConsumo']).toBe('');
    expect(mapa['comparativa.1.alertaDesvio']).toBe('SÍ');
    expect(mapa['costos.costoMaterialesCotizado']).toBe('95.65');
    expect(mapa['costos.costoMaterialesReal']).toBe('130.00');
    expect(mapa.margenReal).toBe('607.40');
  });

  it('2.2 mantiene el dominio sin literales de celda ni dependencias de adaptador', () => {
    const raizDominio = join(resolve(process.cwd(), '..'), 'packages', 'domain', 'src', 'exportacion');
    const fuentes = readFileSync(join(raizDominio, 'modelo.ts'), 'utf8');
    expect(fuentes).not.toMatch(/exceljs|node:fs|Buffer/);
    expect(fuentes).not.toMatch(/`?\b[A-R]\d{1,3}`?/);
  });
});
