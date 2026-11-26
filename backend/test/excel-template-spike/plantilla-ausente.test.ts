import { copyFileSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { esErrorPlantillaNoEncontrada } from '../../src/features/exportacion/excel/carga';
import { puertoConfiguracionExcel } from '../../src/features/exportacion/excel/configuracion';
import { cargarPlantillaParaExportacion } from '../../src/features/exportacion/excel/exportacion';
import { hashDatos } from '../../src/features/exportacion/excel/zip';
import { leerPlantilla, rutaPlantilla } from './soporte';

const dobleBarra = String.fromCharCode(92, 92);
const costeo = 'MASTER COSTEO NUEVO.xlsx' as const;
const op = 'A - OP-MASTER.xlsx' as const;

function capturarError(directorio: string, nombre: string): unknown {
  const puerto = puertoConfiguracionExcel({ EXCEL_TEMPLATES_DIR: directorio });
  try {
    cargarPlantillaParaExportacion(puerto, nombre);
  } catch (error) {
    return error;
  }
  return undefined;
}

describe('plantilla oficial ausente', () => {
  it.each([
    { tarea: '5.1', nombre: costeo },
    { tarea: '5.2', nombre: op },
  ])('$tarea exige error tipado y mensaje operativo para $nombre', ({ nombre }) => {
    const directorio = mkdtempSync(join(tmpdir(), `velco-ausente-${Date.now()}-`));
    try {
      const capturado = capturarError(directorio, nombre);

      expect(esErrorPlantillaNoEncontrada(capturado)).toBe(true);
      if (!esErrorPlantillaNoEncontrada(capturado)) {
        throw new Error('el error no cumple el contrato tipado');
      }
      expect(capturado.code).toBe('plantilla_no_encontrada');
      expect(capturado.nombrePlantilla).toBe(nombre);
      expect(capturado.message).toContain(nombre);
      expect(capturado.message).not.toContain(directorio);
      expect(capturado.message).not.toContain(dobleBarra);
      expect(readdirSync(directorio)).toEqual([]);
    } finally {
      rmSync(directorio, { recursive: true, force: true });
    }
  });

  it('5.3 resuelve la plantilla desde EXCEL_TEMPLATES_DIR sin crear workbook ni salida parcial', () => {
    const directorio = mkdtempSync(join(tmpdir(), `velco-resuelve-${Date.now()}-`));
    try {
      copyFileSync(rutaPlantilla(op), join(directorio, op));
      const puerto = puertoConfiguracionExcel({ EXCEL_TEMPLATES_DIR: directorio });

      const salida = cargarPlantillaParaExportacion(puerto, op);

      expect(hashDatos(salida)).toBe(hashDatos(leerPlantilla(op)));
      expect(readdirSync(directorio)).toEqual([op]);
    } finally {
      rmSync(directorio, { recursive: true, force: true });
    }
  });
});
