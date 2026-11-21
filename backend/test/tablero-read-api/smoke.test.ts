import { describe, expect, it } from 'vitest';
import { buildApp } from '../../src/features/salud/http/app.ts';
import { conAppReal, hayDocker } from './ayuda.ts';
import { configuracionPrueba, crearDependenciasFalsas } from './fixtures.ts';

describe('smoke del tablero read API', () => {
  it('registra las tres rutas nuevas junto a health con dependencias inyectadas', async () => {
    const { dependencias } = crearDependenciasFalsas();
    const app = await buildApp(configuracionPrueba(), dependencias);
    try {
      const documentacion = await app.inject({ method: 'GET', url: '/documentation/json' });
      expect(documentacion.statusCode).toBe(200);
      const paths = Object.keys((documentacion.json() as { paths: Record<string, unknown> }).paths);
      expect(paths).toEqual(
        expect.arrayContaining([
          '/api/health',
          '/api/ops',
          '/api/ops/{id}',
          '/api/ops/{id}/etapas/{etapaId}',
        ]),
      );
      const salud = await app.inject({ method: 'GET', url: '/api/health' });
      expect(salud.statusCode).toBe(200);
    } finally {
      await app.close();
    }
  });

  it.skipIf(!hayDocker())('construye la app con un PrismaClient real y sin mocks', async () => {
    await conAppReal(async ({ app }) => {
      const documentacion = await app.inject({ method: 'GET', url: '/documentation/json' });
      expect(documentacion.statusCode).toBe(200);
      const paths = Object.keys((documentacion.json() as { paths: Record<string, unknown> }).paths);
      expect(paths).toContain('/api/ops');
    });
  });
});
