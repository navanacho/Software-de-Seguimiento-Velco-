import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const raiz = resolve(process.cwd(), '..');
const cambio = ['openspec', 'changes', 'exportacion-costeo'];

function leer(...segmentos: string[]): string {
  return readFileSync(join(raiz, ...cambio, ...segmentos), 'utf8');
}

function tarea(tareas: string, id: string): string {
  const linea = tareas
    .split(/\r?\n/)
    .find((texto) => /^- \[[ x]\] \d+\.\d+ /.test(texto) && texto.includes(`] ${id} `));
  if (linea === undefined) throw new Error(`falta la tarea ${id} en tasks.md`);
  return linea;
}

describe('corrección de alcance: sólo hoja 1 en C-14 (specs, tasks y proposal)', () => {
  const tareas = leer('tasks.md');
  const propuesta = leer('proposal.md');
  const roundtrip = leer('specs', 'excel-roundtrip-plantillas', 'spec.md');
  const modelo = leer('specs', 'modelo-planilla-compartido', 'spec.md');
  const op = leer('specs', 'exportacion-costeo-op', 'spec.md');
  const costos = leer('specs', 'costos-y-margen-real', 'spec.md');

  it('1.4 y 1.5 están cerradas, las tranches 4 y 5 marcadas y la tranche 6 completa', () => {
    expect(tareas).toContain('- [x] 1.4 ');
    expect(tareas).toContain('- [x] 1.5 ');
    expect(tareas).not.toMatch(/^- \[ \] 1\.[45] /m);
    for (const numero of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]) {
      expect(tarea(tareas, `3.${numero}`)).toMatch(/^- \[x\] 3\.\d+ /);
    }
    expect(tareas).not.toMatch(/^- \[ \] 3\.\d+ /m);
    for (const numero of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
      expect(tarea(tareas, `4.${numero}`)).toMatch(/^- \[x\] 4\.\d+ /);
    }
    expect(tareas).not.toMatch(/^- \[ \] 4\.\d+ /m);
    for (const numero of [1, 2, 3, 4, 5, 6]) {
      expect(tarea(tareas, `5.${numero}`)).toMatch(/^- \[x\] 5\.\d+ /);
    }
    expect(tareas).not.toMatch(/^- \[ \] 5\.\d+ /m);
    for (const numero of [1, 2, 3, 4, 5, 6]) {
      expect(tarea(tareas, `6.${numero}`)).toMatch(/^- \[x\] 6\.\d+ /);
    }
    expect(tareas).not.toMatch(/^- \[ \] 6\.[123456] /m);
    expect(tareas).not.toMatch(/^- \[ \] \d+\.\d+ /m);
  });

  it('3.1 y 3.17 están cerradas y 4.1 también', () => {
    expect(tarea(tareas, '3.1')).toMatch(/^- \[x\] 3\.1 /);
    expect(tarea(tareas, '3.17')).toMatch(/^- \[x\] 3\.17 /);
    expect(tarea(tareas, '4.1')).toMatch(/^- \[x\] 4\.1 /);
  });

  it('tasks describen la hoja 1, TOTAL horas con horasReales y el prefijo de tipo', () => {
    expect(tarea(tareas, '3.1')).toContain('`xl/worksheets/sheet2.xml`');
    expect(tarea(tareas, '3.2')).toContain('`sheet2.xml`');
    expect(tarea(tareas, '2.3')).toContain('`TOTAL horas`');
    expect(tarea(tareas, '2.3')).toContain('`horasReales`');
    expect(tarea(tareas, '3.14')).toContain('`[MP]`');
    expect(tarea(tareas, '3.14')).toContain('`[INSUMOS]`');
    expect(tarea(tareas, '3.14')).toContain('`[TERCERIZADOS]`');
    expect(tarea(tareas, '3.16')).toContain('`B38:R59`');
    expect(tarea(tareas, '5.4')).toMatch(/MANUAL/i);
    expect(tarea(tareas, '5.5')).toContain('CRITICAL');
  });

  it('el spec de roundtrip limita la escritura a sheet2.xml sin debilitar la firma', () => {
    expect(roundtrip).toContain('`xl/worksheets/sheet2.xml`');
    expect(roundtrip).toMatch(/byte-a-byte/i);
    expect(roundtrip).toMatch(/MANUAL/i);
    expect(roundtrip).toMatch(/NO DEBE \(SHALL NOT\) considerarse un fallo CRITICAL de la compuerta automática/i);
    expect(roundtrip).toContain('sin la firma, la salida se declara CRITICAL');
  });

  it('el spec de exportación fija numeroOp en C7, TOTAL horas y el prefijo de tipo', () => {
    expect(op).toContain('`C7:R7`');
    expect(op).toMatch(/Descripción:/);
    expect(op).toContain('`TOTAL horas`');
    expect(op).toContain('`horasReales`');
    expect(op).toContain('`horasVendidas`');
    expect(op).toContain('`[MP]` / `[INSUMOS]` / `[TERCERIZADOS]`');
    expect(op).toContain('`B38:R59`');
    expect(op).toContain('`xl/worksheets/sheet2.xml`');
  });

  it('el spec del modelo conserva tipo y unidad semánticos con un material por fila', () => {
    expect(modelo).toContain('`B38:R59`');
    expect(modelo).toContain('un material por fila');
    expect(modelo).toContain('sin inserciones estructurales');
    expect(modelo).toContain('`tipo` y `unidad`');
    expect(modelo).toContain('sin literales de celda en el dominio');
  });

  it('el spec de costos deja el margen para GENERAL manual y la propuesta acota la hoja 1', () => {
    expect(costos).toContain('`GENERAL`');
    expect(costos).toMatch(/manual/i);
    expect(costos).not.toContain('- **THEN** la celda recibe `-33.75`');
    expect(propuesta).not.toContain('las 12 celdas maestras `C6`/`C7` de las hojas `1`..`5`');
    expect(propuesta).toContain('hoja `1`');
    expect(propuesta).toMatch(/MANUAL/i);
  });
});
