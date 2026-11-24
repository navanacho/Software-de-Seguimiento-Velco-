import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

function archivos(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entrada) => {
    const ruta = join(dir, entrada.name);
    return entrada.isDirectory() ? archivos(ruta) : [ruta];
  });
}

describe('guardian precarga de etapas (C-10, R2/R3)', () => {
  const raiz = resolve(process.cwd(), 'src/features/ordenes');
  const fuentes = archivos(raiz).filter((ruta) => /\.(ts|tsx)$/.test(ruta) && !ruta.includes('.test.'));

  it('no duplica reglas de umbrales, tasa ni cálculos derivados', () => {
    for (const archivo of fuentes) {
      const contenido = readFileSync(archivo, 'utf8');
      expect(contenido, archivo).not.toMatch(/diasAlertaRiesgo|porcentajeAvanceRiesgo|valorHoraEstandar/);
      expect(contenido, archivo).not.toMatch(/calcularMargen|calcularSemaforo/);
    }
  });

  it('mantiene la plantilla canónica en un único archivo', () => {
    for (const archivo of fuentes) {
      if (archivo.endsWith('precargaEtapas.ts')) continue;
      const contenido = readFileSync(archivo, 'utf8');
      expect(contenido, archivo).not.toMatch(/'Mecanizado'|'Pintura'/);
    }
  });

  it('consume la configuración mediante el cliente compartido', () => {
    const contenido = readFileSync(resolve(raiz, 'hooks/useEtapasPrecargadas.ts'), 'utf8');
    expect(contenido).toMatch(/consultarConfiguracion/);
    expect(contenido).toMatch(/claveConfiguracion/);
  });
});
