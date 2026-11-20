import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const raiz = resolve(process.cwd(), '..');

type Manifiesto = {
  devDependencies: Record<string, string>;
  scripts: Record<string, string>;
};

function leer(ruta: string): Manifiesto {
  return JSON.parse(readFileSync(join(raiz, ruta), 'utf8')) as Manifiesto;
}

describe('configuración de Vitest 5.1.1', () => {
  it('declara Vitest y los scripts de ejecución en backend y frontend', () => {
    for (const proyecto of ['backend', 'frontend']) {
      const manifiesto = leer(`${proyecto}/package.json`);
      expect(manifiesto.devDependencies.vitest).toBe('5.1.1');
      expect(manifiesto.scripts.test).toContain('vitest');
    }
  });

  it('configura jsdom y testing-library en el frontend', () => {
    const configuracion = readFileSync(join(raiz, 'frontend/vite.config.ts'), 'utf8');
    expect(configuracion).toContain("environment: 'jsdom'");
    const manifiesto = leer('frontend/package.json');
    expect(manifiesto.devDependencies.jsdom).toBe('31.0.1');
    expect(manifiesto.devDependencies['@testing-library/react']).toBe('16.3.3');
  });
});
