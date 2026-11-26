import { normalizarCodigoPlano } from '@velco/domain';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { descriptorPlantilla } from '../../src/features/exportacion/excel/inventario';
import { evidenciaRangoPlano, escribirPlanoEnCelda } from '../../src/features/exportacion/excel/rango';
import { celdaUnica } from '../../src/features/exportacion/excel/xml';
import { hashDatos, leerZip, type PiezaZip } from '../../src/features/exportacion/excel/zip';
import { leerPlantilla } from './soporte';

const op = 'A - OP-MASTER.xlsx' as const;
const piezaHoja = descriptorPlantilla('op').hojas()[0]?.[1] ?? '';
const referenciasAlternativas = [
  'J7', 'K7', 'L7', 'M7', 'N7', 'J8', 'K8', 'L8', 'M8', 'N8',
] as const;

function celdaEn(xmlHoja: string, referencia: string): string {
  return celdaUnica(xmlHoja, referencia);
}

function datosDe(piezas: PiezaZip[], nombre: string): Buffer {
  const pieza = piezas.find((entrada) => entrada.nombre === nombre);
  if (pieza === undefined) {
    throw new Error(`falta la pieza ${nombre}`);
  }
  return pieza.datos;
}

function xmlDe(piezas: PiezaZip[], nombre: string): string {
  return datosDe(piezas, nombre).toString('utf8');
}

function areaImpresion(xmlLibro: string): string | null {
  return xmlLibro.match(
    /<definedName\s+name="_xlnm\.Print_Area"[^>]*>([\s\S]*?)<\/definedName>/,
  )?.[1] ?? null;
}

function archivosDominio(directorio: string): string[] {
  return readdirSync(directorio, { withFileTypes: true }).flatMap((entrada) => {
    const ruta = join(directorio, entrada.name);
    if (entrada.isDirectory()) {
      return archivosDominio(ruta);
    }
    return ruta.endsWith('.ts') && !ruta.endsWith('.test.ts') ? [ruta] : [];
  });
}

describe('celda maestra O7 confirmada por evidencia', () => {
  it('6.1 confirma merge O7:R8, O7 vacía con s=73, PC N°: en J7:N8 y sin etiquetas compartidas', () => {
    const evidencia = evidenciaRangoPlano(leerPlantilla(op));

    expect(evidencia.fusion).toBe('O7:R8');
    expect(evidencia.celdaMaestra).toBe('<c r="O7" s="73"/>');
    expect(evidencia.textoAlternativo).toBe('PC N°: ');
    expect(evidencia.etiquetasEnCompartidas).toEqual({ idPlano: false, sp: false });
  });

  it.each([
    { tarea: '6.2', plano: 'PL-2026-045', esperado: 'ID Plano: PL-2026-045' },
    { tarea: '6.3', plano: null, esperado: 'ID Plano: S/P' },
  ] as const)('$tarea escribe exactamente "$esperado" en O7 con inlineStr', ({ plano, esperado }) => {
    const salida = escribirPlanoEnCelda(leerPlantilla(op), plano);
    const xmlHoja = leerZip(salida).find((pieza) => pieza.nombre === piezaHoja)?.datos.toString('utf8');
    if (xmlHoja === undefined) {
      throw new Error(`falta la pieza ${piezaHoja}`);
    }

    expect(celdaEn(xmlHoja, 'O7')).toBe(
      `<c r="O7" s="73" t="inlineStr"><is><t>${esperado}</t></is></c>`,
    );
    expect(esperado).not.toContain('PL-PL-');
  });

  it('6.4 conserva el estilo s="73" y el merge O7:R8 tras la escritura', () => {
    const salida = escribirPlanoEnCelda(leerPlantilla(op), 'PL-2026-045');
    const evidencia = evidenciaRangoPlano(salida);

    expect(evidencia.fusion).toBe('O7:R8');
    expect(evidencia.celdaMaestra).toContain('s="73"');
    expect(evidencia.celdaMaestra).toContain('t="inlineStr"');
    expect(evidencia.etiquetasEnCompartidas).toEqual({ idPlano: false, sp: false });
  });

  it.each([
    { entrada: ' pl-2026-045 ', esperado: 'ID Plano: PL-2026-045' },
    { entrada: '', esperado: 'ID Plano: S/P' },
  ] as const)('6.5 normaliza "$entrada" en "$esperado" sin tocar sharedStrings', ({ entrada, esperado }) => {
    const original = leerPlantilla(op);
    const salida = escribirPlanoEnCelda(original, normalizarCodigoPlano(entrada));
    const piezasOriginales = leerZip(original);
    const piezasSalida = leerZip(salida);

    expect(celdaEn(xmlDe(piezasSalida, piezaHoja), 'O7')).toBe(
      `<c r="O7" s="73" t="inlineStr"><is><t>${esperado}</t></is></c>`,
    );
    expect(hashDatos(datosDe(piezasSalida, 'xl/sharedStrings.xml'))).toBe(
      hashDatos(datosDe(piezasOriginales, 'xl/sharedStrings.xml')),
    );
  });

  it.each([
    { caso: '6.6 con plano', plano: 'PL-2026-045' },
    { caso: '6.6 sin plano', plano: null },
  ] as const)('$caso conserva J7:N8, Print_Area y printerSettings1.bin byte-a-byte', ({ plano }) => {
    const original = leerPlantilla(op);
    const salida = escribirPlanoEnCelda(original, plano);
    const piezasOriginales = leerZip(original);
    const piezasSalida = leerZip(salida);
    const hojaOriginal = xmlDe(piezasOriginales, piezaHoja);
    const hojaSalida = xmlDe(piezasSalida, piezaHoja);

    for (const referencia of referenciasAlternativas) {
      expect(celdaEn(hojaSalida, referencia)).toBe(celdaEn(hojaOriginal, referencia));
    }
    expect(areaImpresion(xmlDe(piezasSalida, 'xl/workbook.xml'))).toBe("'1640'!$A:$S");
    expect(hashDatos(datosDe(piezasSalida, 'xl/printerSettings/printerSettings1.bin'))).toBe(
      hashDatos(datosDe(piezasOriginales, 'xl/printerSettings/printerSettings1.bin')),
    );
  });

  it('6.7 decide el rango desde un descriptor configurado por evidencia, sin celdas en el dominio', () => {
    expect(descriptorPlantilla('op').rangoPlano).toEqual({
      celda: 'O7',
      fusion: 'O7:R8',
      tipo: 'inlineStr',
      alternativa: { rango: 'J7:N8', texto: 'PC N°: ' },
    });

    const raiz = resolve(process.cwd(), '..');
    const archivos = archivosDominio(join(raiz, 'packages', 'domain', 'src'));
    expect(archivos.length).toBeGreaterThan(0);
    for (const archivo of archivos) {
      const contenido = readFileSync(archivo, 'utf8');
      expect(contenido, archivo).not.toMatch(/\bO7\b|\bR8\b|\bJ7\b|\bN8\b|\bD10\b|\bC6\b/);
    }
  });
});
