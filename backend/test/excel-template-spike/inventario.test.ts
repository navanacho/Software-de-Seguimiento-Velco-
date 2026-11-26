import { createHash, randomUUID } from 'node:crypto';
import { copyFileSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { leerZip } from '../../src/features/exportacion/excel/zip';
import { NOMBRES_PLANTILLAS } from './soporte';

const raiz = resolve(process.cwd(), '..');
const directorioPlantillas = join(raiz, 'Docs', 'FichasExcel');

function hash(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

function rutaOriginal(nombre: string): string {
  return join(directorioPlantillas, nombre);
}

const casos = [
  {
    nombre: 'MASTER COSTEO NUEVO.xlsx',
    piezas: 34,
    criticas: ['xl/externalLinks/externalLink1.xml', 'xl/calcChain.xml'],
  },
  {
    nombre: 'A - OP-MASTER.xlsx',
    piezas: 18,
    criticas: [
      'xl/externalLinks/externalLink1.xml',
      'xl/calcChain.xml',
      'xl/printerSettings/printerSettings1.bin',
    ],
  },
] as const;

describe('safety net de las plantillas oficiales', () => {
  it.each(casos)('1.4 registra los hashes de $nombre y de todas sus piezas OOXML', ({ nombre, piezas, criticas }) => {
    const contenido = readFileSync(rutaOriginal(nombre));
    const hashInicial = hash(contenido);
    const inventario = leerZip(contenido);
    const nombres = new Set(inventario.map((pieza) => pieza.nombre));

    expect(inventario).toHaveLength(piezas);
    for (const piezaCritica of criticas) {
      expect(nombres.has(piezaCritica), piezaCritica).toBe(true);
    }
    for (const pieza of inventario) {
      expect(hash(pieza.datos)).toMatch(/^[0-9a-f]{64}$/);
    }
    expect(hash(readFileSync(rutaOriginal(nombre)))).toBe(hashInicial);
  });

  it('1.6 copia cada plantilla en un directorio temporal distinto y deja el original intacto', () => {
    const temporales: string[] = [];
    try {
      for (const nombre of NOMBRES_PLANTILLAS) {
        const hashInicial = hash(readFileSync(rutaOriginal(nombre)));
        const directorio = mkdtempSync(join(tmpdir(), `velco-excel-spike-${randomUUID()}-`));
        temporales.push(directorio);
        const copia = join(directorio, nombre);
        copyFileSync(rutaOriginal(nombre), copia);

        expect(hash(readFileSync(copia))).toBe(hashInicial);
        expect(hash(readFileSync(rutaOriginal(nombre)))).toBe(hashInicial);
      }
      expect(new Set(temporales).size).toBe(2);
    } finally {
      for (const directorio of temporales) {
        rmSync(directorio, { recursive: true, force: true });
      }
    }
  });
});
