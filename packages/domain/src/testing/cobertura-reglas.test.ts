/// <reference types="node" />
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import * as dominio from '../index.ts';

const REGLAS = [
  'RN-HORAS-01',
  'RN-HORAS-02',
  'RN-HORAS-03',
  'RN-HORAS-04',
  'RN-HORAS-05',
  'RN-HORAS-06',
  'RN-HORAS-07',
  'RN-MARGEN-01',
  'RN-MARGEN-02',
  'RN-MARGEN-03',
  'RN-MARGEN-04',
  'RN-MARGEN-05',
  'RN-MARGEN-06',
] as const;

type Regla = (typeof REGLAS)[number];

const ARCHIVO_VERIFICADOR = 'cobertura-reglas.test.ts';
const DIRECTORIO_FUENTES = fileURLToPath(new URL('../', import.meta.url));

function archivosDeTest(directorio: string): readonly string[] {
  return readdirSync(directorio, { withFileTypes: true }).flatMap((entrada) => {
    const ruta = join(directorio, entrada.name);
    if (entrada.isDirectory()) return archivosDeTest(ruta);
    if (!entrada.isFile() || !entrada.name.endsWith('.test.ts')) return [];
    return entrada.name === ARCHIVO_VERIFICADOR ? [] : [ruta];
  });
}

const TITULOS_DE_TEST = new Set(
  archivosDeTest(DIRECTORIO_FUENTES).flatMap((archivo) => {
    const contenido = readFileSync(archivo, 'utf8');
    return [...contenido.matchAll(/\b(?:it|test)\s*\(\s*(['"`])([^'"`]+)\1/g)].map(
      (coincidencia) => coincidencia[2] ?? '',
    );
  }),
);

function casosPorRegla(regla: Regla): number {
  return [...TITULOS_DE_TEST].filter((titulo) => titulo.includes(regla)).length;
}

describe('C-11 matriz de trazabilidad RN-GLOBAL-04', () => {
  it('lee los títulos reales de los tests de dominio', () => {
    expect(archivosDeTest(DIRECTORIO_FUENTES).length).toBeGreaterThan(0);
    expect(TITULOS_DE_TEST.size).toBeGreaterThan(0);
  });

  it('cubre exactamente RN-HORAS-01..07 y RN-MARGEN-01..06', () => {
    expect(REGLAS).toHaveLength(13);
    expect(new Set(REGLAS).size).toBe(REGLAS.length);
  });

  for (const regla of REGLAS) {
    it(`${regla} tiene al menos dos casos reales etiquetados`, () => {
      expect(casosPorRegla(regla)).toBeGreaterThanOrEqual(2);
    });
  }

  it('IN-02 y RN-HORAS-04 TRIANGULA la tasa global, el umbral 15 y los nombres de C-08', () => {
    expect(dominio.UMBRAL_DESVIO_PORCENTAJE).toBe(15);
    expect(dominio.tasaGlobalNoConfigurada('0.00')).toBe(true);
    expect(dominio.tasaGlobalNoConfigurada('12.50')).toBe(false);
    const alerta = {
      avance: 80,
      horasReales: '3.80',
      horasVendidas: '4.00',
    };
    expect(alerta.avance + dominio.UMBRAL_DESVIO_PORCENTAJE).toBe(95);
    expect(dominio.evaluarAlertaDesvio({ ...alerta, consumo: '95.00' })).toBe(false);
    expect(dominio.evaluarAlertaDesvio({ ...alerta, consumo: '95.01' })).toBe(true);
    const exportados = Object.keys(dominio);
    const funcionesC08 = [
      'calcularHorasVendidasTotales',
      'calcularHorasRealesTotales',
      'calcularDesvioHoras',
      'calcularConsumoHoras',
      'evaluarAlertaDesvio',
    ] as const;
    for (const nombre of funcionesC08) {
      expect(exportados.filter((exportado) => exportado === nombre)).toHaveLength(1);
    }
    for (const alias of ['desvioHoras', 'porcentajeConsumo', 'alertaDesvio', 'calcularDesvio', 'calcularConsumo'] as const) {
      expect(exportados).not.toContain(alias);
    }
  });
});
