import { createHash, randomUUID } from 'node:crypto';
import { copyFileSync, existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { cargarPlantilla, esErrorPlantillaNoEncontrada } from '../../src/features/exportacion/excel/carga';
import { leerZip } from '../../src/features/exportacion/excel/zip';

const raiz = resolve(process.cwd(), '..');
const directorioPlantillas = join(raiz, 'Docs', 'FichasExcel');
const dobleBarra = String.fromCharCode(92, 92);

function hash(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

describe('carga de la plantilla oficial sin workbook improvisado', () => {
  it.each(['MASTER COSTEO NUEVO.xlsx', 'A - OP-MASTER.xlsx'])(
    '1.5 falla con error tipado si falta %s',
    (nombre) => {
      const directorioVacio = mkdtempSync(join(tmpdir(), `velco-sin-plantilla-${randomUUID()}-`));
      try {
        expect(existsSync(join(directorioVacio, nombre))).toBe(false);
        let capturado: unknown;
        try {
          cargarPlantilla(directorioVacio, nombre);
        } catch (error) {
          capturado = error;
        }
        expect(esErrorPlantillaNoEncontrada(capturado)).toBe(true);
        if (!esErrorPlantillaNoEncontrada(capturado)) {
          throw new Error('el error no tiene el contrato tipado esperado');
        }
        expect(capturado.code).toBe('plantilla_no_encontrada');
        expect(capturado.nombrePlantilla).toBe(nombre);
        expect(capturado.message).toContain(nombre);
        expect(capturado.message).not.toContain(directorioVacio);
        expect(capturado.message).not.toContain(dobleBarra);
      } finally {
        rmSync(directorioVacio, { recursive: true, force: true });
      }
    },
  );

  it('1.6 carga copias en directorios temporales distintos sin tocar los originales', () => {
    const temporales: string[] = [];
    try {
      for (const nombre of ['MASTER COSTEO NUEVO.xlsx', 'A - OP-MASTER.xlsx'] as const) {
        const original = join(directorioPlantillas, nombre);
        const hashInicial = hash(readFileSync(original));
        const directorio = mkdtempSync(join(tmpdir(), `velco-carga-${randomUUID()}-`));
        temporales.push(directorio);
        copyFileSync(original, join(directorio, nombre));

        const contenido = cargarPlantilla(directorio, nombre);
        expect(leerZip(contenido).length).toBeGreaterThan(0);
        expect(hash(contenido)).toBe(hashInicial);
        expect(hash(readFileSync(original))).toBe(hashInicial);
      }
      expect(new Set(temporales).size).toBe(2);
    } finally {
      for (const directorio of temporales) {
        rmSync(directorio, { recursive: true, force: true });
      }
    }
  });
});
