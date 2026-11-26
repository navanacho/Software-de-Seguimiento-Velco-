import { createHash, randomUUID } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  descriptorPlantilla,
  type IdPlantilla,
} from '../../src/features/exportacion/excel/inventario';
import { compararPiezas } from '../../src/features/exportacion/excel/gate';
import { parchearPlantilla } from '../../src/features/exportacion/excel/patcher';
import { escribirZip, hashDatos, leerZip, type PiezaZip } from '../../src/features/exportacion/excel/zip';

const raiz = resolve(process.cwd(), '..');
const rutaOriginal = join(raiz, 'Docs', 'FichasExcel', 'A - OP-MASTER.xlsx');
const id: IdPlantilla = 'op';
const piezaHoja = 'xl/worksheets/sheet1.xml';

function hash(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

function valoresOP(d10: string, d11: string): Readonly<Record<string, string>> {
  return { '1640:D10': d10, '1640:D11': d11 };
}

function celda(piezas: PiezaZip[], referencia: string): string {
  const pieza = piezas.find((entrada) => entrada.nombre === piezaHoja);
  if (pieza === undefined) {
    throw new Error(`falta la pieza ${piezaHoja}`);
  }
  const patron = new RegExp(`<c r="${referencia}"(?:\\s[^>]*?)?(?:/>|>[\\s\\S]*?</c>)`);
  const coincidencia = pieza.datos.toString('utf8').match(patron);
  if (coincidencia === null) {
    throw new Error(`falta la celda ${referencia}`);
  }
  return coincidencia[0];
}

function piezaConContenido(piezas: PiezaZip[], nombre: string, contenido: string): PiezaZip[] {
  return piezas.map((pieza) =>
    pieza.nombre === nombre ? { ...pieza, datos: Buffer.from(contenido, 'utf8') } : pieza,
  );
}

describe('patcher OOXML de A - OP-MASTER', () => {
  const permitidas = descriptorPlantilla(id).piezasAutorizadas();

  it('3.1 mantiene el hash de las piezas no autorizadas tras parchear la hoja 1640', () => {
    const original = readFileSync(rutaOriginal);
    const salida = parchearPlantilla(
      id,
      original,
      valoresOP('CLIENTE A', 'Producto A'),
      'PL-2026-045',
    );
    const informe = compararPiezas(original, salida, permitidas);

    expect(informe.conforme).toBe(true);
    expect(informe.piezasNoAutorizadas).toEqual([]);

    const piezasOriginales = leerZip(original);
    const piezasSalida = leerZip(salida);
    for (const pieza of piezasOriginales) {
      if (!permitidas.includes(pieza.nombre)) {
        const equivalente = piezasSalida.find((entrada) => entrada.nombre === pieza.nombre);
        expect(hashDatos(equivalente?.datos ?? Buffer.alloc(0))).toBe(hash(pieza.datos));
      }
    }
  });

  it('3.2 sustituye el par <f>…</f><v>…</v> por <v> en D10 y D11', () => {
    const salida = parchearPlantilla(id, readFileSync(rutaOriginal), valoresOP('CLIENTE A', 'Producto A'), null);
    const piezas = leerZip(salida);

    expect(celda(piezas, 'D10')).toBe('<c r="D10" s="71" t="str"><v>CLIENTE A</v></c>');
    expect(celda(piezas, 'D11')).toBe('<c r="D11" s="71" t="str"><v>Producto A</v></c>');
    expect(celda(piezas, 'D10')).not.toContain('<f>');
    expect(celda(piezas, 'D11')).not.toContain('<f>');
  });

  it.each([
    { plano: 'PL-2026-045', esperado: 'ID Plano: PL-2026-045', d10: 'CLIENTE A', d11: 'Producto A' },
    { plano: null, esperado: 'ID Plano: S/P', d10: 'CLIENTE B', d11: 'Producto B' },
  ])('3.4 triangula con plano=$plano verificando D10/D11, O7 y J7:N8', ({ plano, esperado, d10, d11 }) => {
    const original = readFileSync(rutaOriginal);
    const salida = parchearPlantilla(id, original, valoresOP(d10, d11), plano);
    const piezasOriginales = leerZip(original);
    const piezasSalida = leerZip(salida);

    expect(celda(piezasSalida, 'D10')).toBe(`<c r="D10" s="71" t="str"><v>${d10}</v></c>`);
    expect(celda(piezasSalida, 'D11')).toBe(`<c r="D11" s="71" t="str"><v>${d11}</v></c>`);
    expect(celda(piezasSalida, 'O7')).toBe(
      `<c r="O7" s="73" t="inlineStr"><is><t>${esperado}</t></is></c>`,
    );

    for (const referencia of ['J7', 'K7', 'L7', 'M7', 'N7', 'J8', 'K8', 'L8', 'M8', 'N8']) {
      expect(celda(piezasSalida, referencia)).toBe(celda(piezasOriginales, referencia));
    }
    const compartidasOriginal = piezasOriginales.find((pieza) => pieza.nombre === 'xl/sharedStrings.xml');
    const compartidasSalida = piezasSalida.find((pieza) => pieza.nombre === 'xl/sharedStrings.xml');
    expect(hashDatos(compartidasSalida?.datos ?? Buffer.alloc(0))).toBe(
      hashDatos(compartidasOriginal?.datos ?? Buffer.alloc(0)),
    );
  });

  it('3.5 rechaza un _xlnm.Print_Area corrupto con motivo explícito', () => {
    const original = readFileSync(rutaOriginal);
    const salida = parchearPlantilla(id, original, valoresOP('CLIENTE A', 'Producto A'), null);
    const piezas = leerZip(salida);
    const workbook = piezas.find((pieza) => pieza.nombre === 'xl/workbook.xml');
    if (workbook === undefined) {
      throw new Error('falta xl/workbook.xml');
    }
    const corrupto = workbook.datos
      .toString('utf8')
      .replace("'1640'!$A:$S", '$ANaN:$SNaN');
    const informe = compararPiezas(original, escribirZip(piezaConContenido(piezas, 'xl/workbook.xml', corrupto)), permitidas);

    expect(informe.conforme).toBe(false);
    expect(informe.motivos.join(' ')).toContain('area_de_impresion');
  });

  it('3.5 rechaza un printerSettings1.bin ausente con motivo explícito', () => {
    const original = readFileSync(rutaOriginal);
    const salida = parchearPlantilla(id, original, valoresOP('CLIENTE A', 'Producto A'), null);
    const piezaImpresion = 'xl/printerSettings/printerSettings1.bin';
    const sinImpresion = escribirZip(leerZip(salida).filter((pieza) => pieza.nombre !== piezaImpresion));
    const informe = compararPiezas(original, sinImpresion, permitidas);

    expect(informe.conforme).toBe(false);
    expect(informe.faltantes).toContain(piezaImpresion);
    expect(informe.motivos.join(' ')).toContain(piezaImpresion);
  });

  it('3.6 unifica el descriptor de ambas plantillas sin duplicar celdas ni acoplar frameworks', () => {
    const descriptores = [descriptorPlantilla('costeo'), descriptorPlantilla(id)];
    const referencias = descriptores.flatMap((descriptor) =>
      descriptor.celdas.map((celda) => `${descriptor.archivo}:${celda.pieza}:${celda.referencia}`),
    );

    expect(descriptores.map((descriptor) => descriptor.archivo)).toEqual([
      'MASTER COSTEO NUEVO.xlsx',
      'A - OP-MASTER.xlsx',
    ]);
    expect(descriptores[0]?.celdas).toHaveLength(10);
    expect(descriptores[1]?.celdas).toHaveLength(3);
    expect(referencias).toHaveLength(13);
    expect(new Set(referencias).size).toBe(13);

    const directorioTemporal = mkdtempSync(join(tmpdir(), `velco-descriptor-${randomUUID()}-`));
    try {
      const archivo = join(directorioTemporal, 'inventario.ts');
      writeFileSync(archivo, readFileSync(resolve(raiz, 'backend', 'src', 'features', 'exportacion', 'excel', 'inventario.ts')));
      expect(readFileSync(archivo, 'utf8')).not.toContain("from 'exceljs'");
      expect(readFileSync(archivo, 'utf8')).not.toContain("from 'fastify'");
    } finally {
      rmSync(directorioTemporal, { recursive: true, force: true });
    }
  });
});
