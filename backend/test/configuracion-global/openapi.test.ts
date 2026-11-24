import { describe, expect, it } from 'vitest';
import { buildApp } from '../../src/features/salud/http/app.ts';
import { configuracionPrueba, crearDependenciasFalsas } from '../tablero-read-api/fixtures.ts';

describe('OpenAPI de /api/configuracion', () => {
  it('expone solo GET y PUT sobre el singleton', async () => {
    const app = await buildApp(configuracionPrueba(), crearDependenciasFalsas().dependencias);
    try {
      const respuesta = await app.inject({ method: 'GET', url: '/documentation/json' });
      expect(respuesta.statusCode).toBe(200);
      const paths = respuesta.json().paths as Record<string, Record<string, unknown>>;
      expect(Object.keys(paths['/api/configuracion'] ?? {})).toEqual(['get', 'put']);
      expect(Object.keys(paths).some((ruta) => /configuracion\/\{/.test(ruta))).toBe(false);
    } finally {
      await app.close();
    }
  });
});
