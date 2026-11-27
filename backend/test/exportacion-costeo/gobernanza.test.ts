import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const raiz = resolve(process.cwd(), '..');
const rutaDiseno = join(
  raiz,
  'openspec',
  'changes',
  'exportacion-costeo',
  'design.md',
);

function filaPregunta(diseno: string, id: 'Q1' | 'Q2' | 'Q3'): string {
  const fila = diseno.split(/\r?\n/).find((linea) => /^\|\s*Q\d+\s*\|/.test(linea) && linea.startsWith(`| ${id} `));
  if (fila === undefined) {
    throw new Error(`falta la fila ${id} en la tabla de Open Questions`);
  }
  return fila;
}

describe('gobernanza MEDIO de exportacion-costeo', () => {
  const diseno = readFileSync(rutaDiseno, 'utf8');

  it('1.6 Q1 queda registrada como confirmada con núcleo puro', () => {
    const fila = filaPregunta(diseno, 'Q1');
    expect(fila).toMatch(/CONFIRMADA/i);
    expect(fila).toMatch(/I\/O/i);
    expect(fila.toLowerCase()).toContain('puros');
  });

  it('1.6 Q2 queda RESUELTA con las cuatro decisiones confirmadas por el usuario', () => {
    const fila = filaPregunta(diseno, 'Q2');
    expect(fila).toMatch(/RESUELTA/i);
    expect(fila).toContain('confirmada por el usuario');
    expect(fila).toContain('`xl/worksheets/sheet2.xml`');
    expect(fila).toContain('`inventario-celdas.md`');
    expect(fila).toContain('`numeroOp`');
    expect(fila).toContain('`horasReales`');
    expect(fila).toContain('`[MP]`');
    expect(fila).not.toMatch(/pendiente/i);
    expect(fila).not.toContain('`O7`');
  });

  it('1.6 Q3 queda RESUELTA con escala, regla y comparativa manual fuera de alcance', () => {
    const fila = filaPregunta(diseno, 'Q3');
    expect(fila).toMatch(/RESUELTA/i);
    expect(fila).toContain('confirmada por el usuario');
    expect(fila).toContain('HALF_UP');
    expect(fila).toContain('`horasVendidas`');
    expect(fila).toContain('`GENERAL`');
    expect(fila).not.toMatch(/pendiente/i);
  });

  it('1.6 la compuerta manual de C-14 es distinta de la checklist firmada de C-13', () => {
    expect(diseno).toMatch(/compuerta manual de C-14/i);
    expect(diseno.toLowerCase()).toContain('distinta de la checklist firmada de c-13');
    expect(diseno).toContain('no se crea DD-14');
  });
});
