import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { RUTA_SALUD } from '@velco/domain';
import type { RespuestaSalud } from '@velco/domain';

const raiz = resolve(process.cwd(), '..');

describe('contrato compartido del dominio', () => {
  it('importa el contrato desde el paquete de dominio en el backend', () => {
    const respuesta: RespuestaSalud = { estado: 'ok' };
    expect(RUTA_SALUD).toBe('/api/health');
    expect(respuesta.estado).toBe('ok');
  });

  it('no duplica la definición del contrato en backend ni en frontend', () => {
    const archivos = [
      'backend/src/features/salud/http/app.ts',
      'backend/src/features/salud/http/health.test.ts',
      'frontend/src/app/App.tsx',
      'frontend/src/app/App.test.tsx',
    ];
    for (const archivo of archivos) {
      const contenido = readFileSync(join(raiz, archivo), 'utf8');
      expect(contenido, `${archivo} duplica la interfaz`).not.toMatch(/interface\s+RespuestaSalud/);
    }
  });
});
