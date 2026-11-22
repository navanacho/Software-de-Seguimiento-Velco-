import { describe, expect, it } from 'vitest';
import { buildApp } from '../../src/features/salud/http/app.ts';
import { configuracionPrueba, crearDependenciasFalsas } from '../tablero-read-api/fixtures.ts';

describe('conPlano frontera', () => {
  it('8.4/8.6 conPlano invalido -> 422 y no consulta', async () => {
    const { dependencias, estado } = crearDependenciasFalsas();
    const app = await buildApp(configuracionPrueba(), dependencias);
    try {
      const res = await app.inject({ method: 'GET', url: '/api/ops?conPlano=quizas' });
      expect(res.statusCode).toBe(422);
      expect(res.json()).toMatchObject({ error: 'validation_error' });
      expect(estado.consultas).toEqual([]);
    } finally {
      await app.close();
    }
  });

  it('8.6 TRIANGULA: estadoPlano rechazado DU-1', async () => {
    const { dependencias, estado } = crearDependenciasFalsas();
    const app = await buildApp(configuracionPrueba(), dependencias);
    try {
      const res = await app.inject({ method: 'GET', url: '/api/ops?estadoPlano=con' });
      expect(res.statusCode).toBe(422);
      expect(estado.consultas).toEqual([]);
    } finally {
      await app.close();
    }
  });
});
