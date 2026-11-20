import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const raiz = resolve(process.cwd(), '..');

const decisiones = [
  ['DD-01', 'stack-tecnologico'],
  ['DD-02', 'estrategia-excel'],
  ['DD-03', 'avance-derivado'],
  ['DD-04', 'tasa-hora-global'],
  ['DD-05', 'materiales-normalizados'],
  ['DD-06', 'clientes-entidad-propia'],
  ['DD-07', 'auth-diferida'],
  ['DD-08', 'exportacion-por-op'],
  ['DD-09', 'skills-instaladas'],
  ['DD-10', 'fundacion-openspec'],
] as const;

function leerAdr(identificador: string, slug: string): string {
  return readFileSync(
    join(raiz, 'openspec', 'changes', 'velco-mvp-foundation', 'adr', `${identificador}-${slug}.md`),
    'utf8',
  );
}

describe('ADR versionados DD-01 a DD-10', () => {
  it('registra los diez ADR con contexto, decisión, alternativas, justificación y trade-offs', () => {
    for (const [identificador, slug] of decisiones) {
      const contenido = leerAdr(identificador, slug);
      for (const seccion of ['Estado', 'Contexto', 'Decisión', 'Alternativas', 'Justificación', 'Trade-offs', 'Trazabilidad']) {
        expect(contenido, `${identificador} falta ${seccion}`).toContain(seccion);
      }
    }
  });

  it('documenta las alternativas descartadas y las versiones de DD-01', () => {
    const contenido = leerAdr('DD-01', 'stack-tecnologico');
    for (const alternativa of ['Next.js', 'SQLite', 'openpyxl', 'Express', '8.0.0-rc.34']) {
      expect(contenido).toContain(alternativa);
    }
    for (const version of ['26.13.1', '7.0.2', '19.3.1', '8.3.8', '5.12.8', '7.10.1', '18.7', '5.1.1']) {
      expect(contenido).toContain(version);
    }
    expect(contenido).toContain('2026-11-19');
  });
});
