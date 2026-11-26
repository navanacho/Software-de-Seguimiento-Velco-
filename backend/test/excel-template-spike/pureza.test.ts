import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parchearPlantilla } from '../../src/features/exportacion/excel/patcher';
import { listarArchivosSpike } from './soporte';

const raiz = resolve(process.cwd(), '..');
const rutaOriginal = join(raiz, 'Docs', 'FichasExcel', 'MASTER COSTEO NUEVO.xlsx');

function hash(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

const valores = Object.fromEntries(
  ['1', '2', '3', '4', '5'].flatMap((hoja) => [
    [`${hoja}:C6`, '1234.5600'],
    [`${hoja}:C7`, '987.6543'],
  ]),
);

describe('refactor del patcher', () => {
  it('2.6 el patcher es determinista y no muta el buffer de entrada', () => {
    const original = readFileSync(rutaOriginal);
    const antes = Buffer.from(original);
    const salidaUno = parchearPlantilla('costeo', original, valores);
    const salidaDos = parchearPlantilla('costeo', original, valores);

    expect(hash(salidaUno)).toBe(hash(salidaDos));
    expect(original.equals(antes)).toBe(true);
  });

  it('2.6 el adaptador no usa any ni dependencias de framework', () => {
    const prohibidas = ["from 'exceljs'", "from 'fastify'", "from '@prisma/client'", "from 'react'"];
    for (const archivo of listarArchivosSpike()) {
      if (!archivo.includes(`${join('src', 'features', 'exportacion', 'excel')}`)) {
        continue;
      }
      const contenido = readFileSync(archivo, 'utf8');
      expect(contenido, `${archivo} usa any`).not.toMatch(/:\s*any\b|\bas\s+any\b/);
      for (const dependencia of prohibidas) {
        expect(contenido, `${archivo} importa ${dependencia}`).not.toContain(dependencia);
      }
    }
  });
});
