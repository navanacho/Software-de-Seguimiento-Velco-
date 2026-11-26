import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const raiz = resolve(process.cwd(), '..');
const cambio = join(raiz, 'openspec', 'changes', 'excel-template-spike');
const rutaReporte = join(cambio, 'verify-report.md');
const rutaADR = join(cambio, 'adr', 'estrategia-escritura-excel.md');
const rutaTasks = join(cambio, 'tasks.md');

const FIRMA = 'Firmada por el usuario en nombre de Velco';
const VEREDICTO = '**READY FOR ARCHIVE / compuerta cumplida**';
const PRECEDENTE =
  'openspec/changes/archive/2026-11-25-desvios-y-margen-domain/verify-report.md';
const FRASE_FIRMADA =
  'Con checklist firmada por el usuario en nombre de Velco, el ADR habilita el archive de C-13 y GATE 11 de C-14; el ADR por sí solo no cambia el veredicto de `verify-report.md`.';
const FRASE_AUSENTE =
  'Sin checklist firmada, el ADR mantiene la compuerta bloqueada con veredicto CRITICAL y no habilita C-15.';

function leer(ruta: string): string {
  return readFileSync(ruta, 'utf8');
}

function entre(texto: string, inicio: string, fin: string): string {
  const desde = texto.indexOf(inicio);
  if (desde === -1) {
    throw new Error(`falta la sección ${inicio}`);
  }
  const hasta = texto.indexOf(fin, desde);
  if (hasta === -1) {
    throw new Error(`falta la sección ${fin}`);
  }
  return texto.slice(desde, hasta);
}

function compuertaCumplida(reporte: string, tareas: string): boolean {
  const checklist = entre(reporte, '### Checklist manual (a)–(g)', '### Gate automático');
  const casillas = ['(a)', '(b)', '(c)', '(d)', '(e)', '(f)', '(g)'];
  const contenidos = [
    'sin aviso de reparación',
    'merges',
    "'1640'!$A:$S",
    'ID Plano:',
    'costos, horas y márgenes',
    'variante operativa sin importes',
    'fecha de ejecución',
  ];
  const campos = [
    `| Firma | ${FIRMA} |`,
    '| Fecha de ejecución | 2026-11-26 |',
    '| Versión de Excel | 2611 |',
    '| Responsable | Usuario en nombre de Velco |',
  ];
  const tareasFirmadas = ['- [x] 9.2', '- [x] 9.3', '- [x] 10.5'];
  const filas = checklist.split(/\r?\n/);

  return (
    reporte.includes(VEREDICTO) &&
    reporte.includes('**Compuerta humana**: FIRMADO') &&
    reporte.includes(FRASE_FIRMADA) &&
    reporte.includes('GATE 11 de C-14') &&
    reporte.includes('Decisor: usuario en nombre de Velco') &&
    reporte.includes(PRECEDENTE) &&
    reporte.includes('### Gate automático') &&
    !reporte.includes('PENDIENTE — firma del usuario en nombre de Velco') &&
    !reporte.includes('CRITICAL / compuerta bloqueada') &&
    casillas.every((casilla) => checklist.includes(casilla)) &&
    contenidos.every((contenido) => checklist.includes(contenido)) &&
    campos.every((campo) => checklist.includes(campo)) &&
    casillas.every((casilla) => {
      const fila = filas.find((linea) => linea.startsWith(`| ${casilla} |`));
      return fila !== undefined && fila.includes('CONFIRMADA por el usuario en nombre de Velco');
    }) &&
    tareasFirmadas.every((tarea) => tareas.includes(tarea))
  );
}

const reporteReal = leer(rutaReporte);
const tareasReales = leer(rutaTasks);
const adrReal = leer(rutaADR);

describe('verify-report.md del spike con compuerta humana firmada', () => {
  it('9.1 exige la checklist (a)–(g) confirmada y los campos reales de firma', () => {
    const checklist = entre(reporteReal, '### Checklist manual (a)–(g)', '### Gate automático');
    const casillas = ['(a)', '(b)', '(c)', '(d)', '(e)', '(f)', '(g)'];
    const contenidos = [
      'sin aviso de reparación',
      'merges',
      "'1640'!$A:$S",
      'ID Plano:',
      'costos, horas y márgenes',
      'variante operativa sin importes',
      'fecha de ejecución',
    ];

    for (const casilla of casillas) {
      expect(checklist, `falta la casilla ${casilla}`).toContain(casilla);
    }
    for (const contenido of contenidos) {
      expect(checklist, `falta la verificación ${contenido}`).toContain(contenido);
    }
    for (const campo of [
      `| Firma | ${FIRMA} |`,
      '| Fecha de ejecución | 2026-11-26 |',
      '| Versión de Excel | 2611 |',
      '| Responsable | Usuario en nombre de Velco |',
    ]) {
      expect(checklist, `falta el campo real ${campo}`).toContain(campo);
    }
    expect(reporteReal).toContain('**Compuerta humana**: FIRMADO');
    expect(reporteReal).toContain(VEREDICTO);
  });

  it('9.2 mantiene el gate automático y registra la firma con Excel 2611', () => {
    expect(compuertaCumplida(reporteReal, tareasReales)).toBe(true);
    expect(reporteReal).toContain('- Comparación de todas las piezas del zip por hash');
    expect(reporteReal).toContain('sin fallos preexistentes');
  });

  it.each([
    {
      caso: 'firma completa con Excel 2611',
      reporte: reporteReal,
      tareas: tareasReales,
      esperado: true,
    },
    {
      caso: 'firma incompleta',
      reporte: reporteReal.replace(
        `| Firma | ${FIRMA} |`,
        '| Firma | PENDIENTE — firma del usuario en nombre de Velco |',
      ),
      tareas: tareasReales,
      esperado: false,
    },
    {
      caso: 'versión de Excel ausente',
      reporte: reporteReal.replace('| Versión de Excel | 2611 |', '| Versión de Excel |  |'),
      tareas: tareasReales,
      esperado: false,
    },
    {
      caso: 'casilla (f) sin confirmar',
      reporte: reporteReal.replace(
        /(\| \(f\) \|[^\n]*\| )CONFIRMADA por el usuario en nombre de Velco/,
        '$1PENDIENTE',
      ),
      tareas: tareasReales,
      esperado: false,
    },
  ])('9.3 $caso: la compuerta solo pasa con datos reales completos', ({ reporte, tareas, esperado }) => {
    expect(compuertaCumplida(reporte, tareas)).toBe(esperado);
  });

  it('9.3 conserva las frases de trazabilidad firmada y ausente en el ADR', () => {
    expect(adrReal).toContain(FRASE_FIRMADA);
    expect(adrReal).toContain(FRASE_AUSENTE);
    expect(adrReal).toContain('el ADR por sí solo no cambia el veredicto');
    expect(adrReal).toContain('ahora el reporte refleja la frase firmada');
    expect(reporteReal).toContain(FRASE_FIRMADA);
  });

  it('9.4 registra GATE 11 de C-14 y al usuario en nombre de Velco como decisor', () => {
    expect(reporteReal).toContain('GATE 11 de C-14');
    expect(reporteReal).toContain('Decisor: usuario en nombre de Velco');
    expect(adrReal).toContain('Decisor: usuario en nombre de Velco');
  });

  it('9.5 referencia el precedente de verify-report archivado', () => {
    expect(reporteReal).toContain(PRECEDENTE);
    expect(reporteReal).toContain('sin ejecutar build, commit, push ni archive');
  });

  it('9.6 habilita el archive sin ejecutarlo y marca 9.2, 9.3 y 10.5', () => {
    expect(reporteReal).toContain('no se ejecuta archive, build, commit ni push en esta tranche');
    expect(reporteReal).toContain(VEREDICTO);
    for (const tarea of ['- [x] 9.2', '- [x] 9.3', '- [x] 10.5']) {
      expect(tareasReales, `falta ${tarea}`).toContain(tarea);
    }
  });
});
