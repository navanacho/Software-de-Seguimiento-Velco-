import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const raiz = resolve(process.cwd(), '..');
const rutaADR = join(
  raiz,
  'openspec',
  'changes',
  'excel-template-spike',
  'adr',
  'estrategia-escritura-excel.md',
);
const rutaReporte = join(raiz, 'openspec', 'changes', 'excel-template-spike', 'verify-report.md');

function leer(ruta: string): string {
  return readFileSync(ruta, 'utf8');
}

describe('ADR del spike de plantillas Excel', () => {
  it('7.1 exige las siete secciones contractuales', () => {
    const adr = leer(rutaADR);
    const secciones = [
      '## Estado',
      '## Contexto',
      '## Decisión',
      '## Alternativas',
      '## Justificación',
      '## Trade-offs',
      '## Trazabilidad',
    ];

    for (const seccion of secciones) {
      expect(adr, `falta la sección ${seccion}`).toContain(seccion);
    }
  });

  it('7.2 exige las cinco decisiones aprobadas con su evidencia', () => {
    const adr = leer(rutaADR);
    const decisiones = [
      'D1 — Enlaces externos como metadata histórica',
      'D2 — Parche OOXML quirúrgico',
      'D3 — Celda maestra O7',
      'D4 — UNC histórica sin uso en runtime',
      'D5 — Validación en doble capa',
    ];
    const evidencias = [
      'cinco decisiones aprobadas',
      '577.125 B en OP',
      '994 B en costeo',
      '12 `[1]` neutralizadas',
      'ID Plano: <valor>',
      'ID Plano: S/P',
      'UNC sin uso en runtime',
      'doble capa',
    ];

    expect(adr).toContain('cinco decisiones aprobadas por el usuario en nombre de Velco');
    for (const decision of decisiones) {
      expect(adr, `falta la decisión ${decision}`).toContain(decision);
    }
    for (const evidencia of evidencias) {
      expect(adr, `falta la evidencia ${evidencia}`).toContain(evidencia);
    }
  });

  it('7.3 exige el descarte documentado y el estado de DD-02 e IN-08 sin DD-14', () => {
    const adr = leer(rutaADR);

    expect(adr).toContain('guardado/reapertura con `exceljs`');
    expect(adr).toContain('136.961 → 21.288 B');
    expect(adr).toContain('273.751 → 311.479 B');
    expect(adr).toMatch(/DD-02[^\n]*enmendada/);
    expect(adr).toMatch(/IN-08[^\n]*RESUELTA[^\n]*condicionada/);
    expect(adr).toMatch(/(?:sin crear|no se crea) DD-14/);
    expect(adr).not.toMatch(/^###\s+DD-14/m);
  });

  it('7.4 exige decisor, fecha y compuerta para C-13, C-14 y C-15', () => {
    const adr = leer(rutaADR);

    expect(adr).toContain('Decisor: usuario en nombre de Velco');
    expect(adr).toContain('2026-11-26');
    expect(adr).toContain('C-13');
    expect(adr).toContain('C-14');
    expect(adr).toContain('C-15');
    expect(adr).toContain('GATE 11');
  });

  it.each([
    {
      caso: 'checklist firmada',
      frase:
        'Con checklist firmada por el usuario en nombre de Velco, el ADR habilita el archive de C-13 y GATE 11 de C-14; el ADR por sí solo no cambia el veredicto de `verify-report.md`.',
    },
    {
      caso: 'checklist ausente',
      frase:
        'Sin checklist firmada, el ADR mantiene la compuerta bloqueada con veredicto CRITICAL y no habilita C-15.',
    },
  ])('7.5 $caso no altera por sí solo el veredicto del reporte firmado', ({ frase }) => {
    const adr = leer(rutaADR);
    const reporte = leer(rutaReporte);

    expect(adr).toContain(frase);
    expect(adr).toContain('ahora el reporte refleja la frase firmada');
    expect(reporte).toContain('**READY FOR ARCHIVE / compuerta cumplida**');
    expect(reporte).toContain('| Firma | Firmada por el usuario en nombre de Velco |');
    expect(reporte).not.toContain('CRITICAL / compuerta bloqueada');
  });

  it('7.6 exige trazabilidad cruzada con specs, roadmap y documentación canónica', () => {
    const adr = leer(rutaADR);
    const referencias = [
      'excel-spike-adricion',
      'excel-roundtrip-plantillas',
      'excel-plano-rango-confirmado',
      'excel-plantilla-ausente',
      'decisiones-arquitectonicas',
      'CHANGES.md',
      'Docs/definici_n_del_mvp_velco.md',
      'knowledge-base/09_decisiones_y_supuestos.md',
      'knowledge-base/10_preguntas_abiertas.md',
      'gate-controlado.test.ts',
      'verify-report.md',
    ];

    for (const referencia of referencias) {
      expect(adr, `falta la referencia ${referencia}`).toContain(referencia);
    }
  });
});
