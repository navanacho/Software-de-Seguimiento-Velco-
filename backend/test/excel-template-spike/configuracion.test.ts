import { copyFileSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  cargarPlantillaConConfiguracion,
  cargarPlantillaConPuerto,
  puertoConfiguracionExcel,
} from '../../src/features/exportacion/excel/configuracion';
import { hashDatos, leerZip } from '../../src/features/exportacion/excel/zip';
import { leerPlantilla, listarArchivosSpike, rutaPlantilla } from './soporte';

type Entorno = Readonly<Record<string, string | undefined>>;

const raiz = resolve(process.cwd(), '..');
const nombrePlantilla = 'A - OP-MASTER.xlsx' as const;

function entornoCon(directorio: string, referenciaHistorica: string | undefined): Entorno {
  return {
    EXCEL_TEMPLATES_DIR: directorio,
    ...(referenciaHistorica === undefined ? {} : { EXCEL_UNC_BASE: referenciaHistorica }),
  };
}

describe('configuración del adaptador Excel', () => {
  it('4.4 produce la misma salida con la referencia histórica definida y ausente', () => {
    const directorio = mkdtempSync(join(tmpdir(), `velco-config-${Date.now()}-`));
    try {
      copyFileSync(rutaPlantilla(nombrePlantilla), join(directorio, nombrePlantilla));

      const conReferencia = cargarPlantillaConConfiguracion(
        entornoCon(directorio, 'referencia-definida'),
        nombrePlantilla,
      );
      const sinReferencia = cargarPlantillaConConfiguracion(
        entornoCon(directorio, undefined),
        nombrePlantilla,
      );

      expect(hashDatos(sinReferencia)).toBe(hashDatos(conReferencia));
      expect(hashDatos(conReferencia)).toBe(hashDatos(leerPlantilla(nombrePlantilla)));
      expect(leerZip(sinReferencia).length).toBeGreaterThan(0);
    } finally {
      rmSync(directorio, { recursive: true, force: true });
    }
  });

  it('4.6 centraliza la lectura de entorno en un puerto del adaptador, sin UNC literal', () => {
    const directorio = mkdtempSync(join(tmpdir(), `velco-puerto-${Date.now()}-`));
    try {
      copyFileSync(rutaPlantilla(nombrePlantilla), join(directorio, nombrePlantilla));

      const puerto = puertoConfiguracionExcel(entornoCon(directorio, 'referencia-definida'));
      expect(puerto.directorioPlantillas()).toBe(directorio);
      expect(puerto.referenciaHistoricaUnc()).toBe('referencia-definida');

      let consultasReferencia = 0;
      const puertoEspia = {
        directorioPlantillas: () => directorio,
        referenciaHistoricaUnc: () => {
          consultasReferencia += 1;
          return 'referencia-definida';
        },
      };
      const salida = cargarPlantillaConPuerto(puertoEspia, nombrePlantilla);
      expect(consultasReferencia).toBe(0);
      expect(hashDatos(salida)).toBe(hashDatos(leerPlantilla(nombrePlantilla)));

      const archivos = listarArchivosSpike();
      const fuentesAdaptador = archivos.filter((archivo) =>
        archivo.includes(join('src', 'features', 'exportacion', 'excel')),
      );
      const conEntorno = fuentesAdaptador.filter((archivo) =>
        readFileSync(archivo, 'utf8').includes('process.env'),
      );
      expect(conEntorno).toHaveLength(1);
      expect(conEntorno[0]).toContain(
        join('src', 'features', 'exportacion', 'excel', 'configuracion.ts'),
      );

      const entornoEjemplo = readFileSync(join(raiz, '.env.example'), 'utf8');
      const valorUnc = entornoEjemplo.split('EXCEL_UNC_BASE=')[1]?.trim() ?? '';
      const servidorUnc = valorUnc.split(String.fromCharCode(92)).filter(Boolean)[0] ?? '';
      expect(servidorUnc.length).toBeGreaterThan(0);
      for (const archivo of archivos) {
        expect(readFileSync(archivo, 'utf8'), archivo).not.toContain(servidorUnc);
      }
    } finally {
      rmSync(directorio, { recursive: true, force: true });
    }
  });
});
