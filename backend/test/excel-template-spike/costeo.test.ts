import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
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
const rutaOriginal = join(raiz, 'Docs', 'FichasExcel', 'MASTER COSTEO NUEVO.xlsx');
const id: IdPlantilla = 'costeo';

function hash(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

function valoresCosteo(c6: string, c7: string): Readonly<Record<string, string>> {
  return Object.fromEntries(
    ['1', '2', '3', '4', '5'].flatMap((hoja) => [
      [`${hoja}:C6`, c6],
      [`${hoja}:C7`, c7],
    ]),
  );
}

function celda(piezas: PiezaZip[], nombre: string, referencia: string): string {
  const pieza = piezas.find((entrada) => entrada.nombre === nombre);
  if (pieza === undefined) {
    throw new Error(`falta la pieza ${nombre}`);
  }
  const patron = new RegExp(`<c r="${referencia}"(?:\\s[^>]*?)?(?:/>|>[\\s\\S]*?</c>)`);
  const coincidencia = pieza.datos.toString('utf8').match(patron);
  if (coincidencia === null) {
    throw new Error(`falta la celda ${referencia} en ${nombre}`);
  }
  return coincidencia[0];
}

describe('patcher OOXML de MASTER COSTEO NUEVO', () => {
  const permitidas = descriptorPlantilla(id).piezasAutorizadas();

  it('2.1 falla el gate si cualquier pieza OOXML no autorizada cambia de hash', () => {
    const original = readFileSync(rutaOriginal);
    const salida = parchearPlantilla(id, original, valoresCosteo('1234.5600', '987.6543'));
    const informe = compararPiezas(original, salida, permitidas);

    expect(informe.conforme).toBe(true);
    expect(informe.piezasNoAutorizadas).toEqual([]);

    const piezasOriginales = leerZip(original);
    const piezasSalida = leerZip(salida);
    for (const pieza of piezasOriginales) {
      if (!permitidas.includes(pieza.nombre)) {
        const equivalente = piezasSalida.find((entrada) => entrada.nombre === pieza.nombre);
        expect(equivalente).toBeDefined();
        expect(hashDatos(equivalente?.datos ?? Buffer.alloc(0))).toBe(hash(pieza.datos));
      }
    }
  });

  it('2.2 sustituye el par <f>…</f><v>…</v> por <v> en C6 y C7 de las hojas 1..5', () => {
    const salida = parchearPlantilla(id, readFileSync(rutaOriginal), valoresCosteo('1234.5600', '987.6543'));
    const piezas = leerZip(salida);

    for (const [hoja, pieza] of descriptorPlantilla(id).hojas()) {
      const c6 = celda(piezas, pieza, 'C6');
      const c7 = celda(piezas, pieza, 'C7');
      expect(c6).toBe(`<c r="C6" s="31"><v>1234.5600</v></c>`);
      expect(c7).toBe(`<c r="C7" s="31"><v>987.6543</v></c>`);
      expect(c6).not.toContain('<f>');
      expect(c7).not.toContain('<f>');
      expect(hoja).toMatch(/^[1-5]$/);
    }
  });

  it.each([
    { c6: '1234.5600', c7: '987.6543' },
    { c6: '0', c7: '-15.75' },
  ])('2.4 triangula valores de BD c6=$c6 c7=$c7', ({ c6, c7 }) => {
    const original = readFileSync(rutaOriginal);
    const salida = parchearPlantilla(id, original, valoresCosteo(c6, c7));
    const piezas = leerZip(salida);

    for (const [, pieza] of descriptorPlantilla(id).hojas()) {
      expect(celda(piezas, pieza, 'C6')).toBe(`<c r="C6" s="31"><v>${c6}</v></c>`);
      expect(celda(piezas, pieza, 'C7')).toBe(`<c r="C7" s="31"><v>${c7}</v></c>`);
    }
    expect(compararPiezas(original, salida, permitidas).conforme).toBe(true);
  });

  it('2.5 detecta una diferencia inyectada en xl/externalLinks/externalLink1.xml', () => {
    const original = readFileSync(rutaOriginal);
    const salida = parchearPlantilla(id, original, valoresCosteo('1234.5600', '987.6543'));
    const piezaEnlace = 'xl/externalLinks/externalLink1.xml';
    const modificadas: PiezaZip[] = leerZip(salida).map((pieza) =>
      pieza.nombre === piezaEnlace
        ? { ...pieza, datos: Buffer.concat([pieza.datos, Buffer.from('<!--inyectado-->')]) }
        : pieza,
    );
    const informe = compararPiezas(original, escribirZip(modificadas), permitidas);

    expect(informe.conforme).toBe(false);
    expect(informe.piezasNoAutorizadas).toContain(piezaEnlace);
  });
});
