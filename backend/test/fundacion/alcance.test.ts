import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const raiz = resolve(process.cwd(), '..');
const cambioArchivado = join(raiz, 'openspec', 'changes', 'archive', '2026-11-20-velco-mvp-foundation');

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
    const propuesta = readFileSync(join(cambioArchivado, 'proposal.md'), 'utf8');
    const diseno = readFileSync(join(cambioArchivado, 'design.md'), 'utf8');
    const tareas = readFileSync(join(cambioArchivado, 'tasks.md'), 'utf8');
    const especificacion = readFileSync(
      join(cambioArchivado, 'specs', 'entorno-desarrollo', 'spec.md'),
      'utf8',
    );

    expect(propuesta).toContain('sin modelos de negocio');
    expect(propuesta).toContain('las migraciones y el seed comienzan en C-02');
    expect(diseno).toContain('no define modelos de negocio');
    expect(diseno).toContain('No hay migraciones de base de datos en este change');
    expect(especificacion).toContain('Esquema Prisma inicializado sin modelos de negocio');
    expect(tareas).toContain('sin modelos de negocio ni columnas derivadas');
    expect(tareas).toContain('Verificar que no se crearon reglas de negocio, modelos de dominio, migraciones');

    const artefactos = archivos(cambioArchivado);
    const codigoArchivado = artefactos.filter((ruta) =>
      ['.ts', '.tsx', '.js', '.jsx', '.py', '.sql', '.prisma'].some((extension) => ruta.endsWith(extension)),
    );
    expect(codigoArchivado, 'el change archivado no debe contener código de implementación').toEqual([]);
    for (const artefacto of artefactos.filter((ruta) => ruta.endsWith('.md'))) {
      const contenido = readFileSync(artefacto, 'utf8');
      expect(contenido, `${artefacto} contiene una regla RN`).not.toMatch(/RN-[A-Z]+-\d+/);
      expect(contenido, `${artefacto} calcula un derivado`).not.toMatch(
        /calcularMargen|calcularAvance|calcularSem[aá]foro/,
      );
    }
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
      join(raiz, 'openspec', 'changes', 'archive', '2026-11-20-velco-mvp-foundation', 'adr', 'README.md'),
      'utf8',
    );
    expect(indice).toContain('HU-19');
    expect(indice).toContain('Fase 2');
    expect(indice).toContain('Admin/Oficina');
    expect(indice).toContain('sin montos');
  });
});
