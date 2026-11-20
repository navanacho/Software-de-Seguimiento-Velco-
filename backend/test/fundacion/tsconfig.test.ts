import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const raiz = resolve(process.cwd(), '..');

type Configuracion = {
  compilerOptions: Record<string, unknown>;
  extends?: string;
  include?: string[];
};

function leerTsconfig(ruta: string): Configuracion {
  return JSON.parse(readFileSync(join(raiz, ruta), 'utf8')) as Configuracion;
}

describe('configuración TypeScript estricta', () => {
  it('define un tsconfig base estricto heredado por los tres proyectos', () => {
    const base = leerTsconfig('tsconfig.base.json');
    expect(base.compilerOptions.strict).toBe(true);
    expect(base.compilerOptions.noImplicitAny).toBe(true);
    expect(base.compilerOptions.noEmit).toBe(true);
    expect(base.compilerOptions.verbatimModuleSyntax).toBe(true);

    expect(leerTsconfig('backend/tsconfig.json').extends).toBe('../tsconfig.base.json');
    expect(leerTsconfig('frontend/tsconfig.json').extends).toBe('../tsconfig.base.json');
    expect(leerTsconfig('packages/domain/tsconfig.json').extends).toBe('../../tsconfig.base.json');
  });

  it('mantiene el dominio sin tipos de framework y aísla las fuentes de cada proyecto', () => {
    const dominio = leerTsconfig('packages/domain/tsconfig.json');
    expect(dominio.compilerOptions.types).toEqual([]);

    const backend = leerTsconfig('backend/tsconfig.json');
    const frontend = leerTsconfig('frontend/tsconfig.json');
    expect(backend.include).toContain('src/**/*.ts');
    expect(frontend.include).toContain('src/**/*.tsx');
  });
});
