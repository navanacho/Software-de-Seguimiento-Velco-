import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const raiz = resolve(process.cwd(), '..');

function archivos(directorio: string, excluidas: string[] = []): string[] {
  if (!existsSync(directorio) || excluidas.some((nombre) => directorio.includes(nombre))) {
    return [];
  }
  return readdirSync(directorio, { withFileTypes: true }).flatMap((entrada) => {
    const ruta = join(directorio, entrada.name);
    return entrada.isDirectory() ? archivos(ruta, excluidas) : [ruta];
  });
}

const fuentes = [
  ...archivos(join(raiz, 'backend', 'src')),
  ...archivos(join(raiz, 'frontend', 'src')),
  ...archivos(join(raiz, 'packages', 'domain', 'src')),
].filter((ruta) => ruta.endsWith('.ts') || ruta.endsWith('.tsx'));

describe('alcance del change de fundación', () => {
  it('no crea reglas de negocio, modelos de dominio ni migraciones', () => {
    for (const archivo of fuentes) {
      const contenido = readFileSync(archivo, 'utf8');
      expect(contenido, `${archivo} contiene una regla RN`).not.toMatch(/RN-[A-Z]+-\d+/);
      expect(contenido, `${archivo} calcula un derivado`).not.toMatch(/calcularMargen|calcularAvance|calcularSem[aá]foro/);
    }
    expect(readFileSync(join(raiz, 'backend', 'prisma', 'schema.prisma'), 'utf8')).not.toMatch(/^\s*model\s+/m);
    expect(existsSync(join(raiz, 'backend', 'prisma', 'migrations'))).toBe(false);
  });

  it('no incorpora autenticación, PIN, RBAC ni archivos .xlsx nuevos', () => {
    for (const archivo of fuentes) {
      const contenido = readFileSync(archivo, 'utf8');
      expect(contenido, `${archivo} incorpora auth`).not.toMatch(/\b(login|password|rbac|pin)\b/i);
    }
    const creados = archivos(raiz, ['node_modules', '\\.git', 'Docs']).filter((ruta) => ruta.endsWith('.xlsx'));
    expect(creados).toEqual([]);
  });

  it('deja la visibilidad de montos documentada para HU-19 en Fase 2', () => {
    const indice = readFileSync(
      join(raiz, 'openspec', 'changes', 'velco-mvp-foundation', 'adr', 'README.md'),
      'utf8',
    );
    expect(indice).toContain('HU-19');
    expect(indice).toContain('Fase 2');
    expect(indice).toContain('Admin/Oficina');
    expect(indice).toContain('sin montos');
  });
});
