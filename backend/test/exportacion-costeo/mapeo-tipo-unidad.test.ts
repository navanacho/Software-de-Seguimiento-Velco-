import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { construirModeloPlanilla, type EntradaModeloPlanilla } from '@velco/domain';
import { describe, expect, it } from 'vitest';
import { generarCosteo } from '../../src/features/exportacion/excel/costeo';
import { descriptorPlantilla } from '../../src/features/exportacion/excel/inventario';
import { mapearModeloACeldas } from '../../src/features/exportacion/excel/mapeo';
import { leerPlantilla } from '../excel-template-spike/soporte';

function entrada(): EntradaModeloPlanilla {
  return {
    cliente: 'ACME S.A.',
    numeroOp: 'OP-2026-001',
    materiales: [
      {
        tipo: 'MP',
        descripcion: 'Acero',
        cantidad: '2.0000',
        unidad: 'kg',
        costoUnitarioCotizado: '9.00',
        costoUnitarioReal: '10.50',
      },
      {
        tipo: 'INSUMOS',
        descripcion: 'Pintura',
        cantidad: '1.0000',
        unidad: null,
        costoUnitarioCotizado: '4.00',
        costoUnitarioReal: null,
      },
      {
        tipo: 'TERCERIZADOS',
        descripcion: 'Rectificado',
        cantidad: '3.0000',
        unidad: 'UN',
        costoUnitarioCotizado: '7.00',
        costoUnitarioReal: null,
      },
    ],
    horasVendidas: '10.00',
    horasReales: '8.00',
    valorHora: '32.8250',
    montoVendido: '1000.00',
    comparativa: [],
    incluirMargenes: true,
  };
}

describe('3.14 tipo y unidad en el MAP puro', () => {
  it('antepone el prefijo según tipo y conserva unidad y costo elegido', () => {
    const mapa = mapearModeloACeldas(construirModeloPlanilla(entrada()));

    expect(mapa['materiales.0.descripcion']).toBe('[MP] Acero');
    expect(mapa['materiales.0.un']).toBe('kg');
    expect(mapa['materiales.0.costoUnitario']).toBe('10.50');
    expect(mapa['materiales.0.costoTotal']).toBe('21.00');
    expect(mapa['materiales.1.descripcion']).toBe('[INSUMOS] Pintura');
    expect(mapa['materiales.1.un']).toBe('');
    expect(mapa['materiales.1.costoUnitario']).toBe('4.00');
    expect(mapa['materiales.1.costoTotal']).toBe('4.00');
    expect(mapa['materiales.2.descripcion']).toBe('[TERCERIZADOS] Rectificado');
    expect(mapa['materiales.2.un']).toBe('UN');
    expect(mapa['materiales.2.costoUnitario']).toBe('7.00');
    expect(mapa['materiales.2.costoTotal']).toBe('21.00');
  });

  it('no agrega filas ni claves fuera del inventario de la hoja 1', () => {
    const mapa = mapearModeloACeldas(construirModeloPlanilla(entrada()));
    const clavesMaterial = Object.keys(mapa).filter((clave) => clave.startsWith('materiales.'));

    expect(clavesMaterial).toHaveLength(3 * 7);
    expect(clavesMaterial.every((clave) => /^materiales\.[0-2]\./.test(clave))).toBe(true);
    expect(Object.keys(mapa).some((clave) => /^materiales\.3\./.test(clave))).toBe(false);
  });

  it('3.16 TRIANGULA el MAP con el bloque B38:R59 y genera un costeo verificable', () => {
    const modelo = construirModeloPlanilla(entrada());
    const mapa = mapearModeloACeldas(modelo);
    const descriptor = descriptorPlantilla('costeo-c14');
    const referenciasMaterial = descriptor.celdas
      .filter((celda) => celda.clave.startsWith('materiales.'))
      .map((celda) => celda.referencia);

    expect(referenciasMaterial).toHaveLength(19 * 5);
    expect(referenciasMaterial.every((referencia) => /^[COPQR](?:4\d|5[0-8])$/.test(referencia))).toBe(
      true,
    );
    for (const celda of descriptor.celdas) {
      const coincidencia = /^materiales\.(\d+)\./.exec(celda.clave);
      const indice = coincidencia?.[1];
      if (indice !== undefined && Number(indice) >= modelo.materiales.length) {
        continue;
      }
      expect(mapa[celda.clave], celda.clave).toBeDefined();
    }
    expect(mapa['materiales.1.un']).toBe('');
    expect(() => generarCosteo(leerPlantilla('MASTER COSTEO NUEVO.xlsx'), mapa)).not.toThrow();
  });

  it('3.17 el dominio sigue sin literales de celda ni any', () => {
    const raiz = join(resolve(process.cwd(), '..'), 'packages', 'domain', 'src');
    const archivosEn = (directorio: string): string[] =>
      readdirSync(directorio, { withFileTypes: true }).flatMap((entrada) => {
        const ruta = join(directorio, entrada.name);
        if (entrada.isDirectory()) return archivosEn(ruta);
        return ruta.endsWith('.ts') && !ruta.endsWith('.test.ts') ? [ruta] : [];
      });
    const archivos = [...archivosEn(join(raiz, 'exportacion')), ...archivosEn(join(raiz, 'materiales'))];

    expect(archivos.length).toBeGreaterThan(0);
    for (const archivo of archivos) {
      const texto = readFileSync(archivo, 'utf8');
      expect(texto, archivo).not.toMatch(/\bany\b/);
      expect(texto, archivo).not.toMatch(/`?\b[A-R]\d{1,3}`?/);
    }
  });
});
