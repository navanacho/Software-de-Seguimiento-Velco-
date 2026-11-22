import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

function archivos(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const ruta = join(dir, e.name);
    return e.isDirectory() ? archivos(ruta) : ruta;
  });
}

describe('guardian tablero (4.14, RN-GLOBAL-02, D4/D9)', () => {
  it('no importa funciones de cálculo ni compara fechas con new Date en features/tablero y shared/domain-client', () => {
    const raices = [
      resolve(process.cwd(), 'src/features/tablero'),
      resolve(process.cwd(), 'src/shared/domain-client'),
    ];
    const fuentes = raices.flatMap((raiz) => archivos(raiz).filter((r) => /\.(ts|tsx)$/.test(r) && !r.includes('.test.')));
    for (const archivo of fuentes) {
      const contenido = readFileSync(archivo, 'utf8');
      expect(contenido, archivo).not.toMatch(/calcularSemaforo|diasRestantes\(|etapaAhora\(|construirTarjetaOrden|agruparFlujo/);
      expect(contenido, archivo).not.toMatch(/new Date\(/);
    }
  });

  it('no compara fechas para derivar estado en tablero y shared/domain-client', () => {
    const raices = [
      resolve(process.cwd(), 'src/features/tablero'),
      resolve(process.cwd(), 'src/shared/domain-client'),
    ];
    const fuentes = raices.flatMap((raiz) => archivos(raiz).filter((r) => /\.(ts|tsx)$/.test(r) && !r.includes('.test.')));
    for (const archivo of fuentes) {
      const contenido = readFileSync(archivo, 'utf8');
      expect(contenido, archivo).not.toMatch(/Date\.now|localeCompare\(.*fecha|fechaEntrega\s*[<>]|[<>]\s*fechaEntrega/);
    }
  });
});
