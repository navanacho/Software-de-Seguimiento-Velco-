import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const raiz = resolve(process.cwd(), '..');

type Manifiesto = {
  scripts: Record<string, string>;
  workspaces: string[];
};

describe('estructura feature-based del workspace', () => {
  it('crea los directorios de dominio, backend, frontend y los scripts raíz', () => {
    const directorios = [
      'packages/domain/src/salud',
      'backend/src/features/salud/application',
      'backend/src/features/salud/http',
      'backend/src/features/salud/prisma',
      'backend/src/features/salud/excel',
      'backend/src/shared',
      'frontend/src/features/salud/components',
      'frontend/src/features/salud/hooks',
      'frontend/src/features/salud/queries',
      'frontend/src/shared',
      'frontend/src/app',
    ];

    for (const directorio of directorios) {
      expect(existsSync(join(raiz, directorio)), `falta ${directorio}`).toBe(true);
    }
    expect(existsSync(join(raiz, 'frontend/src/global.css'))).toBe(true);

    const manifiesto = JSON.parse(readFileSync(join(raiz, 'package.json'), 'utf8')) as Manifiesto;
    expect(manifiesto.scripts.test).toBeDefined();
    expect(manifiesto.scripts.typecheck).toBeDefined();
    expect(manifiesto.workspaces).toContain('packages/*');
    expect(manifiesto.workspaces).toContain('backend');
    expect(manifiesto.workspaces).toContain('frontend');
  });
});
