import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const raiz = resolve(process.cwd(), '..');
const indice = (): string =>
  readFileSync(
    join(raiz, 'openspec', 'changes', 'archive', '2026-11-20-velco-mvp-foundation', 'adr', 'README.md'),
    'utf8',
  );

describe('riesgos y decisiones declaradas', () => {
  it('mantiene IN-08 y DD-07 abiertos con decisor y siguiente hito', () => {
    const contenido = indice();
    expect(contenido).toContain('IN-08');
    expect(contenido).toContain('ABIERTA');
    expect(contenido).toContain('C-13');
    expect(contenido).toContain('C-14');
    expect(contenido).toContain('DD-07');
    expect(contenido).toContain('Fase 2');
    expect(contenido).toContain('aprobación humana');
  });

  it('registra IN-09 como resuelta y acota los roles a HU-19 en Fase 2', () => {
    const contenido = indice();
    expect(contenido).toContain('IN-09');
    expect(contenido).toContain('RESUELTA');
    expect(contenido).toContain('Docs/MVP.md');
    expect(contenido).toContain('Docs/HistoriasDeUsuario.md');
    expect(contenido).toContain('no se recuperan');
    expect(contenido).toContain('HU-19');
    expect(contenido).toContain('Admin/Oficina');
    expect(contenido).toContain('Taller');
    expect(contenido).toContain('sin montos');
    expect(contenido).toContain('ZIP');
  });
});
