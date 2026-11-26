import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { NOMBRES_PLANTILLAS } from './soporte';

const raiz = resolve(process.cwd(), '..');
const directorioPlantillas = join(raiz, 'Docs', 'FichasExcel');
const directorioTests = join(raiz, 'backend', 'test', 'excel-template-spike');
const directorioAdaptador = join(raiz, 'backend', 'src', 'features', 'exportacion', 'excel');

function archivosDe(directorio: string): string[] {
  return readdirSync(directorio, { withFileTypes: true }).flatMap((entrada) => {
    const ruta = join(directorio, entrada.name);
    return entrada.isDirectory() ? archivosDe(ruta) : [ruta];
  });
}

describe('preparación del spike de plantillas', () => {
  it('1.1 confirma en disco los nombres exactos de las dos plantillas oficiales', () => {
    expect(NOMBRES_PLANTILLAS).toEqual(['MASTER COSTEO NUEVO.xlsx', 'A - OP-MASTER.xlsx']);
    for (const nombre of NOMBRES_PLANTILLAS) {
      expect(existsSync(join(directorioPlantillas, nombre)), nombre).toBe(true);
    }
  });

  it('1.2 documenta las variables y no fija una ruta UNC en código ni en tests', () => {
    const entorno = readFileSync(join(raiz, '.env.example'), 'utf8');
    expect(entorno).toContain('EXCEL_TEMPLATES_DIR=');
    expect(entorno).toContain('EXCEL_UNC_BASE=');
    const valorUnc = entorno.split('EXCEL_UNC_BASE=')[1]?.trim() ?? '';
    const servidorUnc = valorUnc.split(String.fromCharCode(92)).filter(Boolean)[0] ?? '';
    expect(servidorUnc.length).toBeGreaterThan(0);
    for (const archivo of [...archivosDe(directorioTests), ...archivosDe(directorioAdaptador)]) {
      expect(readFileSync(archivo, 'utf8'), archivo).not.toContain(servidorUnc);
    }
  });

  it('1.3 aísla el espacio de tests y el adaptador del spike', () => {
    expect(existsSync(directorioTests)).toBe(true);
    expect(existsSync(directorioAdaptador)).toBe(true);
  });
});
