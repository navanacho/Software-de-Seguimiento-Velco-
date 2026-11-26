import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { puertoConfiguracionExcel } from '../../src/features/exportacion/excel/configuracion';
import { exportarConGate } from '../../src/features/exportacion/excel/validacion';
import {
  areaImpresion,
  compararConDiffControlado,
  verificarTextoPlano,
} from '../../src/features/exportacion/excel/gate';
import {
  descriptorPlantilla,
  type IdPlantilla,
} from '../../src/features/exportacion/excel/inventario';
import { parchearPlantilla } from '../../src/features/exportacion/excel/patcher';
import { celdaUnica, mapaCeldas } from '../../src/features/exportacion/excel/xml';
import { escribirZip, hashDatos, leerZip, type PiezaZip } from '../../src/features/exportacion/excel/zip';
import { casoDePlantilla, leerPlantilla, listarArchivosSpike } from './soporte';

const raiz = resolve(process.cwd(), '..');
const piezaEnlace = 'xl/externalLinks/externalLink1.xml';
const piezaImpresion = 'xl/printerSettings/printerSettings1.bin';

function piezaConContenido(piezas: PiezaZip[], nombre: string, contenido: Buffer | string): PiezaZip[] {
  return piezas.map((pieza) =>
    pieza.nombre === nombre
      ? { ...pieza, datos: typeof contenido === 'string' ? Buffer.from(contenido, 'utf8') : contenido }
      : pieza,
  );
}

function mutarCeldaNoAutorizada(original: Buffer, id: IdPlantilla): Buffer {
  const descriptor = descriptorPlantilla(id);
  const declaradas = new Set(descriptor.celdas.map((celda) => celda.referencia));
  const piezas = leerZip(original);

  for (const [hoja, nombrePieza] of descriptor.hojas()) {
    const pieza = piezas.find((entrada) => entrada.nombre === nombrePieza);
    if (pieza === undefined) {
      throw new Error(`falta la pieza de la hoja ${hoja}`);
    }
    const xml = pieza.datos.toString('utf8');
    for (const [referencia, celda] of mapaCeldas(xml)) {
      if (declaradas.has(referencia) || !celda.endsWith('</c>')) {
        continue;
      }
      return escribirZip(piezaConContenido(piezas, nombrePieza, xml.replace(celda, celda.replace('</c>', '<!--inyectado--></c>'))));
    }
  }
  throw new Error('no se encontró una celda no autorizada para inyectar la diferencia');
}

describe('gate automatizado con diff controlado', () => {
  it('8.1 hashorea todas las piezas y rechaza un cambio de celda no declarada', () => {
    const caso = casoDePlantilla('MASTER COSTEO NUEVO.xlsx');
    const original = leerPlantilla(caso.nombre);
    const salida = parchearPlantilla(caso.id, original, caso.valores, caso.plano);
    const informe = compararConDiffControlado(caso.id, original, salida);

    expect(informe.piezasComparadas).toBe(leerZip(original).length);
    expect(informe.piezasComparadas).toBeGreaterThan(0);
    expect(informe.conforme).toBe(true);
    expect(informe.diferencias).toHaveLength(10);

    const rechazo = compararConDiffControlado(caso.id, original, mutarCeldaNoAutorizada(original, caso.id));
    expect(rechazo.conforme).toBe(false);
    expect(rechazo.diferenciasNoAutorizadas.length).toBeGreaterThan(0);
    expect(rechazo.diferenciasNoAutorizadas[0]?.celda).not.toBe('C6');
  });

  it('8.2 informa hoja, celda, valor esperado y valor obtenido', () => {
    const costeo = casoDePlantilla('MASTER COSTEO NUEVO.xlsx');
    const salidaCosteo = parchearPlantilla(
      costeo.id,
      leerPlantilla(costeo.nombre),
      costeo.valores,
      costeo.plano,
    );
    const informeCosteo = compararConDiffControlado(
      costeo.id,
      leerPlantilla(costeo.nombre),
      salidaCosteo,
    );
    const c6 = informeCosteo.diferencias.find((diferencia) => diferencia.celda === 'C6');

    expect(c6).toBeDefined();
    expect(c6?.hoja).toMatch(/^[1-5]$/);
    expect(c6?.valorEsperado).toContain('<f>');
    expect(c6?.valorObtenido).toBe('<c r="C6" s="31"><v>1234.5600</v></c>');

    const op = casoDePlantilla('A - OP-MASTER.xlsx');
    const originalOP = leerPlantilla(op.nombre);
    const salidaOP = parchearPlantilla(op.id, originalOP, op.valores, op.plano);
    const o7 = compararConDiffControlado(op.id, originalOP, salidaOP).diferencias.find(
      (diferencia) => diferencia.celda === 'O7',
    );

    expect(o7?.hoja).toBe('1640');
    expect(o7?.valorEsperado).toBe('<c r="O7" s="73"/>');
    expect(o7?.valorObtenido).toContain('ID Plano: PL-2026-045');
  });

  it('8.3 acepta el diff autorizado de las doce celdas maestras más O7', () => {
    const costeo = casoDePlantilla('MASTER COSTEO NUEVO.xlsx');
    const op = casoDePlantilla('A - OP-MASTER.xlsx');
    const originalCosteo = leerPlantilla(costeo.nombre);
    const originalOP = leerPlantilla(op.nombre);
    const informeCosteo = compararConDiffControlado(
      costeo.id,
      originalCosteo,
      parchearPlantilla(costeo.id, originalCosteo, costeo.valores, costeo.plano),
    );
    const informeOP = compararConDiffControlado(
      op.id,
      originalOP,
      parchearPlantilla(op.id, originalOP, op.valores, op.plano),
    );

    expect(informeCosteo.diferencias.map((diferencia) => diferencia.celda).sort()).toEqual([
      'C6', 'C6', 'C6', 'C6', 'C6', 'C7', 'C7', 'C7', 'C7', 'C7',
    ]);
    expect(informeOP.diferencias.map((diferencia) => diferencia.celda).sort()).toEqual([
      'D10', 'D11', 'O7',
    ]);
    expect(informeCosteo.conforme).toBe(true);
    expect(informeOP.conforme).toBe(true);
  });

  it('8.3 rechaza un cambio en xl/externalLinks/externalLink1.xml', () => {
    const caso = casoDePlantilla('MASTER COSTEO NUEVO.xlsx');
    const original = leerPlantilla(caso.nombre);
    const salida = parchearPlantilla(caso.id, original, caso.valores, caso.plano);
    const modificadas = leerZip(salida).map((pieza) =>
      pieza.nombre === piezaEnlace
        ? { ...pieza, datos: Buffer.concat([pieza.datos, Buffer.from('<!--inyectado-->')]) }
        : pieza,
    );
    const informe = compararConDiffControlado(caso.id, original, escribirZip(modificadas));

    expect(informe.conforme).toBe(false);
    expect(informe.piezasNoAutorizadas).toContain(piezaEnlace);
  });

  it('8.3 rechaza un cambio en xl/printerSettings/printerSettings1.bin', () => {
    const caso = casoDePlantilla('A - OP-MASTER.xlsx');
    const original = leerPlantilla(caso.nombre);
    const salida = parchearPlantilla(caso.id, original, caso.valores, caso.plano);
    const modificadas = leerZip(salida).map((pieza) =>
      pieza.nombre === piezaImpresion
        ? { ...pieza, datos: Buffer.concat([pieza.datos, Buffer.from([0x00])]) }
        : pieza,
    );
    const informe = compararConDiffControlado(caso.id, original, escribirZip(modificadas));

    expect(informe.conforme).toBe(false);
    expect(informe.piezasNoAutorizadas).toContain(piezaImpresion);
  });

  it('8.4 exige _xlnm.Print_Area exacto y rechaza $ANaN:$SNaN', () => {
    const original = leerPlantilla('A - OP-MASTER.xlsx');
    const workbook = leerZip(original).find((pieza) => pieza.nombre === 'xl/workbook.xml');
    if (workbook === undefined) {
      throw new Error('falta xl/workbook.xml');
    }
    const corrupto = escribirZip(
      piezaConContenido(
        leerZip(original),
        'xl/workbook.xml',
        workbook.datos.toString('utf8').replace("'1640'!$A:$S", '$ANaN:$SNaN'),
      ),
    );

    expect(areaImpresion(original)).toBe("'1640'!$A:$S");
    expect(areaImpresion(corrupto)).toBe('$ANaN:$SNaN');
    expect(compararConDiffControlado('op', original, corrupto).conforme).toBe(false);
  });

  it.each([
    { plano: 'PL-2026-045', esperado: 'ID Plano: PL-2026-045' },
    { plano: null, esperado: 'ID Plano: S/P' },
  ])('8.5 exige el texto exacto "$esperado" en O7 con J7:N8 intacto', ({ plano, esperado }) => {
    const caso = casoDePlantilla('A - OP-MASTER.xlsx');
    const original = leerPlantilla(caso.nombre);
    const salida = parchearPlantilla(caso.id, original, caso.valores, plano);
    const informe = verificarTextoPlano(original, salida, esperado);

    expect(informe.conforme).toBe(true);
    expect(informe.obtenido).toBe(esperado);
    expect(informe.alternativaIntacta).toBe(true);
  });

  it('8.5 rechaza una salida con J7:N8 alterado aunque O7 sea correcto', () => {
    const caso = casoDePlantilla('A - OP-MASTER.xlsx');
    const original = leerPlantilla(caso.nombre);
    const salida = parchearPlantilla(caso.id, original, caso.valores, 'PL-2026-045');
    const piezas = leerZip(salida);
    const hoja = piezas.find(
      (pieza) => pieza.nombre === descriptorPlantilla('op').hojas()[0]?.[1],
    );
    if (hoja === undefined) {
      throw new Error('falta la hoja 1640');
    }
    const xml = hoja.datos.toString('utf8');
    const j7 = celdaUnica(xml, 'J7');
    const alternativaAlterada = '<c r="J7" s="75" t="inlineStr"><is><t>PC N°: X</t></is></c>';
    const alterado = escribirZip(piezaConContenido(piezas, hoja.nombre, xml.replace(j7, alternativaAlterada)));
    const informe = verificarTextoPlano(original, alterado, 'ID Plano: PL-2026-045');

    expect(informe.obtenido).toBe('ID Plano: PL-2026-045');
    expect(informe.alternativaIntacta).toBe(false);
    expect(informe.conforme).toBe(false);
  });

  it('8.6 devuelve 500 sin workbook ni Content-Disposition cuando falta la plantilla', () => {
    const directorio = mkdtempSync(join(tmpdir(), 'velco-gate-sin-plantilla-'));
    try {
      const puerto = puertoConfiguracionExcel({ EXCEL_TEMPLATES_DIR: directorio });
      const resultado = exportarConGate(
        puerto,
        'costeo',
        { '1:C6': '1', '1:C7': '2' },
        null,
      );

      expect(resultado.tipo).toBe('error');
      if (resultado.tipo !== 'error') {
        throw new Error('se esperaba el contrato de error');
      }
      expect(resultado.estado).toBe(500);
      expect(resultado.cuerpo.error).toBe('plantilla_no_encontrada');
      expect(resultado.cuerpo.message).toContain('MASTER COSTEO NUEVO.xlsx');
      expect(Object.keys(resultado).sort()).toEqual(['cabeceras', 'cuerpo', 'estado', 'tipo']);
      expect(resultado.cabeceras['content-disposition']).toBeUndefined();
      expect(resultado.cabeceras['Content-Disposition']).toBeUndefined();
    } finally {
      rmSync(directorio, { recursive: true, force: true });
    }
  });

  it('8.8 el comparador es puro, determinista y no muta los buffers de entrada', () => {
    const caso = casoDePlantilla('A - OP-MASTER.xlsx');
    const original = leerPlantilla(caso.nombre);
    const copia = Buffer.from(original);
    const salida = parchearPlantilla(caso.id, original, caso.valores, caso.plano);
    const copiaSalida = Buffer.from(salida);
    const primero = compararConDiffControlado(caso.id, original, salida);
    const segundo = compararConDiffControlado(caso.id, original, salida);

    expect(primero).toEqual(segundo);
    expect(hashDatos(original)).toBe(hashDatos(copia));
    expect(hashDatos(salida)).toBe(hashDatos(copiaSalida));
  });

  it('8.8 el comparador y el gate no usan any ni frameworks en el adaptador', () => {
    const rutaAdaptador = join(raiz, 'backend', 'src', 'features', 'exportacion', 'excel');
    const archivos = listarArchivosSpike().filter((archivo) => archivo.startsWith(rutaAdaptador));
    const prohibidas = [
      "from 'exceljs'",
      "from 'fastify'",
      "from '@prisma/client'",
      "from 'react'",
    ];

    expect(archivos.length).toBeGreaterThan(0);
    for (const archivo of archivos) {
      const contenido = readFileSync(archivo, 'utf8');
      expect(contenido, `${archivo} usa any`).not.toMatch(/:\s*any\b|\bas\s+any\b/);
      for (const dependencia of prohibidas) {
        expect(contenido, `${archivo} importa ${dependencia}`).not.toContain(dependencia);
      }
    }
  });
});
