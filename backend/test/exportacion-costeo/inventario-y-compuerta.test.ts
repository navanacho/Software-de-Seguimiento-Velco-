import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const raiz = resolve(process.cwd(), '..');
const cambio = ['openspec', 'changes', 'exportacion-costeo'];

function leer(...segmentos: string[]): string {
  return readFileSync(join(raiz, ...cambio, ...segmentos), 'utf8');
}

function filaPregunta(diseno: string, id: 'Q2' | 'Q3'): string {
  const fila = diseno.split(/\r?\n/).find((linea) => linea.startsWith(`| ${id} |`));
  if (fila === undefined) throw new Error(`falta la fila ${id} en Open Questions`);
  return fila;
}

describe('enmienda opción A de C-14', () => {
  const diseno = leer('design.md');
  const tareas = leer('tasks.md');
  const propuesta = leer('proposal.md');
  const roundtrip = leer('specs', 'excel-roundtrip-plantillas', 'spec.md');
  const modelo = leer('specs', 'modelo-planilla-compartido', 'spec.md');

  it('D7 describe el costeo generado, sin costeo histórico y sin reabrir C-13', () => {
    expect(diseno).toContain('costeo generado a partir de datos reales de una OP');
    expect(diseno).toContain('No existe costeo histórico de Velco');
    expect(diseno).toContain('abierta y verificada por el usuario en nombre de Velco en Excel');
    expect(diseno).toContain('sin reabrir la checklist firmada de C-13');
  });

  it('el gate generado y su firma son consistentes entre spec, tasks y proposal', () => {
    expect(roundtrip).toContain('costeo generado a partir de datos reales de una OP');
    expect(roundtrip).toContain('No existe costeo histórico de Velco');
    expect(roundtrip).toContain('sin la firma, la salida se declara CRITICAL');
    expect(tareas).toContain('5.4 RED/GREEN: generar el `.xlsx` desde una OP real');
    expect(tareas).toContain('5.5 RED/GREEN: registro de compuerta manual con fecha, versión de Excel y responsable; sin firma, el veredicto queda CRITICAL;');
    expect(propuesta).not.toContain('cotejo contra un costeo real de Velco');
  });

  it('el modelo compartido transporta tipo y unidad sin literales de celda', () => {
    expect(modelo).toContain('`tipo` y `unidad`');
    expect(modelo).toContain('sin literales de celda en el dominio');
    expect(tareas).toContain('3.11 RED: extender `MaterialModeloPlanilla` y `EntradaModeloPlanilla` con `tipo` y `unidad`');
    expect(tareas).toContain('3.14 RED: actualizar `mapearModeloACeldas`');
    expect(diseno).toContain('`tipo` y `unidad`');
  });

  it('el inventario justificado está versionado, con hash antes/después y niveles de confianza', () => {
    const inventario = leer('inventario-celdas.md');
    expect(inventario).toContain('1FA2DA0031D2A06BBAC506057F3679D77CA835D1EB70B8657F19D95A47649602');
    expect(inventario).toContain('SHA-256 después');
    expect(inventario).toContain('sheet2.xml');
    expect(inventario).toContain('confirmada por etiqueta');
    expect(inventario).toContain('inferida de fórmula');
    expect(inventario).toContain('incierta');
    expect(diseno).toContain('`inventario-celdas.md`');
    expect(tareas).toContain('`inventario-celdas.md`');
  });

  it('Q2 y Q3 quedan resueltas con las decisiones confirmadas por el usuario', () => {
    const q2 = filaPregunta(diseno, 'Q2');
    const q3 = filaPregunta(diseno, 'Q3');
    expect(q2).toContain('RESUELTA');
    expect(q2).toContain('confirmada por el usuario');
    expect(q2).toContain('`inventario-celdas.md`');
    expect(q2).toContain('`xl/worksheets/sheet2.xml`');
    expect(q2).not.toContain('pendiente');
    expect(q3).toContain('RESUELTA');
    expect(q3).toContain('HALF_UP');
    expect(q3).toContain('`horasReales`');
    expect(q3).not.toContain('pendiente');
    expect(diseno).toContain('tareas 1.4 y 1.5');
  });
});
