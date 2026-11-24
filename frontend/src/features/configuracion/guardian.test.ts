import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

function archivos(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entrada) => {
    const ruta = join(dir, entrada.name);
    return entrada.isDirectory() ? archivos(ruta) : [ruta];
  });
}

describe('guardian configuración global (C-10, R3, R9)', () => {
  const raiz = resolve(process.cwd(), 'src/features/configuracion');
  const fuentes = archivos(raiz).filter((ruta) => /\.(ts|tsx)$/.test(ruta) && !ruta.includes('.test.'));

  it('no calcula derivados ni fechas en React', () => {
    for (const archivo of fuentes) {
      const contenido = readFileSync(archivo, 'utf8');
      expect(contenido, archivo).not.toMatch(/calcularMargen|calcularSemaforo|Date\.now|new Date\(/);
    }
  });

  it('no persiste configuración en almacenamiento local ni usa any', () => {
    for (const archivo of fuentes) {
      const contenido = readFileSync(archivo, 'utf8');
      expect(contenido, archivo).not.toMatch(/localStorage|sessionStorage|\bany\b/);
    }
  });

  it('valida con el dominio en lugar de duplicar reglas en la vista', () => {
    const contenido = readFileSync(resolve(raiz, 'components/FormularioConfiguracion.tsx'), 'utf8');
    expect(contenido).toMatch(/validarConfiguracion/);
  });
});
