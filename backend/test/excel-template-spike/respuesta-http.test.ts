import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { puertoConfiguracionExcel } from '../../src/features/exportacion/excel/configuracion';
import { cargarPlantillaParaExportacion } from '../../src/features/exportacion/excel/exportacion';
import { traducirErrorPlantilla } from '../../src/features/exportacion/excel/respuesta';

const raiz = resolve(process.cwd(), '..');
const directorioAdaptador = join(raiz, 'backend', 'src', 'features', 'exportacion', 'excel');
const nombrePlantilla = 'MASTER COSTEO NUEVO.xlsx' as const;

function dobleRuta(directorio: string): unknown {
  const puerto = puertoConfiguracionExcel({ EXCEL_TEMPLATES_DIR: directorio });
  try {
    cargarPlantillaParaExportacion(puerto, nombrePlantilla);
    return { estado: 200 };
  } catch (error) {
    return traducirErrorPlantilla(error);
  }
}

describe('traducción HTTP del error de plantilla ausente', () => {
  it('5.4 el doble de ruta devuelve 500 con error tipado y mensaje operativo', () => {
    const directorio = mkdtempSync(join(tmpdir(), `velco-http-${Date.now()}-`));
    try {
      const respuesta = dobleRuta(directorio) as {
        estado: number;
        cuerpo: { error: string; message: string };
      };

      expect(respuesta.estado).toBe(500);
      expect(respuesta.cuerpo.error).toBe('plantilla_no_encontrada');
      expect(respuesta.cuerpo.message).toContain(nombrePlantilla);
      expect(respuesta.cuerpo.message).not.toContain(directorio);
    } finally {
      rmSync(directorio, { recursive: true, force: true });
    }
  });

  it('5.5 la respuesta de error no incluye Content-Disposition de descarga', () => {
    const directorio = mkdtempSync(join(tmpdir(), `velco-http-cabeceras-${Date.now()}-`));
    try {
      const respuesta = dobleRuta(directorio) as {
        cabeceras?: Readonly<Record<string, string>>;
      };

      expect(respuesta.cabeceras).toBeDefined();
      expect(Object.keys(respuesta.cabeceras ?? {})).toEqual(['content-type']);
      expect(respuesta.cabeceras?.['content-disposition']).toBeUndefined();
      expect(respuesta.cabeceras?.['Content-Disposition']).toBeUndefined();
    } finally {
      rmSync(directorio, { recursive: true, force: true });
    }
  });

  it('5.5 la respuesta de error no incluye un Buffer de .xlsx ni archivo parcial', () => {
    const directorio = mkdtempSync(join(tmpdir(), `velco-http-buffer-${Date.now()}-`));
    try {
      const respuesta = dobleRuta(directorio) as Record<string, unknown>;

      expect(Object.keys(respuesta).sort()).toEqual(['cabeceras', 'cuerpo', 'estado']);
      expect(Buffer.isBuffer(respuesta['buffer'])).toBe(false);
      expect(Buffer.isBuffer(respuesta['archivo'])).toBe(false);
    } finally {
      rmSync(directorio, { recursive: true, force: true });
    }
  });

  it('5.6 separa la traducción HTTP de la lógica de carga', () => {
    const respuesta = readFileSync(join(directorioAdaptador, 'respuesta.ts'), 'utf8');
    const carga = readFileSync(join(directorioAdaptador, 'carga.ts'), 'utf8');
    const errores = readFileSync(join(directorioAdaptador, 'errores.ts'), 'utf8');

    expect(respuesta).not.toContain("from './carga'");
    expect(respuesta).not.toContain('node:fs');
    expect(respuesta).toContain("from './errores'");
    expect(carga).toContain("from './errores'");
    expect(errores).toContain('plantilla_no_encontrada');
  });
});
