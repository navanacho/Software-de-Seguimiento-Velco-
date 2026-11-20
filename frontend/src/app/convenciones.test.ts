import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const raiz = resolve(process.cwd());

function archivos(directorio: string, extension: string): string[] {
  const entradas = readdirSync(directorio, { withFileTypes: true });
  return entradas.flatMap((entrada) => {
    const ruta = join(directorio, entrada.name);
    return entrada.isDirectory() ? archivos(ruta, extension) : ruta.endsWith(extension) ? [ruta] : [];
  });
}

describe('convenciones del frontend', () => {
  it('usa componentes en PascalCase y tipado estricto sin any', () => {
    for (const archivo of archivos(join(raiz, 'src'), '.tsx').filter((ruta) => !ruta.endsWith('.test.tsx'))) {
      const contenido = readFileSync(archivo, 'utf8');
      const nombres = [...contenido.matchAll(/export function (\w+)/g)].map((coincidencia) => coincidencia[1]);
      for (const nombre of nombres) {
        expect(nombre, `${archivo} exporta ${nombre} sin PascalCase`).toMatch(/^[A-Z]/);
      }
      expect(contenido, `${archivo} usa any`).not.toMatch(/:\s*any\b|\bas\s+any\b/);
    }
  });

  it('no calcula derivados ni incluye slider de avance o columnas Kanban', () => {
    const fuentes = [...archivos(join(raiz, 'src'), '.ts'), ...archivos(join(raiz, 'src'), '.tsx')]
      .filter((ruta) => !ruta.includes('.test.'));
    for (const archivo of fuentes) {
      const contenido = readFileSync(archivo, 'utf8');
      expect(contenido, `${archivo} incluye un control o derivado descartado`).not.toMatch(
        /porcentaje_avance|sem[aá]foro|type=["']range|kanban/i,
      );
    }
  });

  it('usa un único global.css, CSS Modules y clsx sin Tailwind', () => {
    expect(archivos(join(raiz, 'src'), 'global.css')).toHaveLength(1);
    expect(archivos(join(raiz, 'src'), '.module.css').length).toBeGreaterThan(0);
    expect(readFileSync(join(raiz, 'package.json'), 'utf8')).toContain('"clsx": "2.1.1"');
    expect(readFileSync(join(raiz, 'package.json'), 'utf8')).not.toContain('tailwindcss');
    for (const nombre of ['tailwind.config.js', 'tailwind.config.ts', 'postcss.config.js']) {
      expect(existsSync(join(raiz, nombre)), `existe ${nombre}`).toBe(false);
    }
  });
});
