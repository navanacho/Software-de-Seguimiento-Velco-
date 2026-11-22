import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

function archivos(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entrada) => {
    const ruta = join(dir, entrada.name);
    return entrada.isDirectory() ? archivos(ruta) : ruta;
  });
}

describe('guardian del cliente HTTP (R2, R9, RN-OP-06)', () => {
  it('no importa frameworks de backend ni declara any en shared/domain-client', () => {
    const raiz = resolve(process.cwd(), 'src/shared/domain-client');
    const fuentes = archivos(raiz).filter((ruta) => /\.(ts|tsx)$/.test(ruta) && !ruta.includes('.test.'));
    expect(fuentes.length).toBeGreaterThan(0);
    for (const archivo of fuentes) {
      const contenido = readFileSync(archivo, 'utf8');
      expect(contenido, archivo).not.toMatch(/from\s+['"](fastify|@prisma\/client|exceljs)/);
      expect(contenido, archivo).not.toMatch(/\bany\b/);
      expect(contenido, archivo).not.toMatch(/normalizarCodigoPlano|calcularSemaforo|construirTarjetaOrden/);
    }
  });
});
