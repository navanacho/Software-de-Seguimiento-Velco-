import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { RecursoNoEncontradoError } from '../../src/shared/errores.ts';
import { buildApp } from '../../src/features/salud/http/app.ts';
import {
  configuracionPrueba,
  crearDependenciasFalsas,
  crearEtapas,
  crearOrden,
} from './fixtures.ts';

describe('validación de frontera del tablero', () => {
  it('D5 RN-GLOBAL-02 rechaza 2027-02-30 con 422 antes de consultar repositorios', async () => {
    const { dependencias, estado } = crearDependenciasFalsas();
    const app = await buildApp(configuracionPrueba(), dependencias);
    try {
      const respuesta = await app.inject({
        method: 'GET',
        url: '/api/ops?fechaDesde=2027-02-30',
      });
      expect(respuesta.statusCode).toBe(422);
      expect(respuesta.json()).toMatchObject({ error: 'validation_error' });
      expect(estado.consultas).toEqual([]);
    } finally {
      await app.close();
    }
  });

  it('D5 TRIANGULA: rechaza rango invertido con 422', async () => {
    const { dependencias, estado } = crearDependenciasFalsas();
    const app = await buildApp(configuracionPrueba(), dependencias);
    try {
      const respuesta = await app.inject({
        method: 'GET',
        url: '/api/ops?fechaDesde=2027-03-10&fechaHasta=2027-03-09',
      });
      expect(respuesta.statusCode).toBe(422);
      expect(estado.consultas).toEqual([]);
    } finally {
      await app.close();
    }
  });

  it('D5 TRIANGULA: rechaza estado desconocido con 422', async () => {
    const { dependencias, estado } = crearDependenciasFalsas();
    const app = await buildApp(configuracionPrueba(), dependencias);
    try {
      const respuesta = await app.inject({ method: 'GET', url: '/api/ops?estado=Desconocido' });
      expect(respuesta.statusCode).toBe(422);
      expect(estado.consultas).toEqual([]);
    } finally {
      await app.close();
    }
  });

  it('D5 TRIANGULA: rechaza clienteId no UUID con 422', async () => {
    const { dependencias, estado } = crearDependenciasFalsas();
    const app = await buildApp(configuracionPrueba(), dependencias);
    try {
      const respuesta = await app.inject({ method: 'GET', url: '/api/ops?clienteId=no-es-uuid' });
      expect(respuesta.statusCode).toBe(422);
      expect(estado.consultas).toEqual([]);
    } finally {
      await app.close();
    }
  });

  it('D5 TRIANGULA: rechaza buscar de más de 100 caracteres con 422', async () => {
    const { dependencias, estado } = crearDependenciasFalsas();
    const app = await buildApp(configuracionPrueba(), dependencias);
    try {
      const respuesta = await app.inject({
        method: 'GET',
        url: `/api/ops?buscar=${'x'.repeat(101)}`,
      });
      expect(respuesta.statusCode).toBe(422);
      expect(estado.consultas).toEqual([]);
    } finally {
      await app.close();
    }
  });

  it('D5 RN-GLOBAL-01 rechaza body de PATCH inválido sin escribir', async () => {
    const ordenId = randomUUID();
    const etapaId = randomUUID();
    const etapas = crearEtapas(['Corte'], ordenId).map((etapa) => ({ ...etapa, id: etapaId }));
    const { dependencias, estado } = crearDependenciasFalsas({
      ops: [crearOrden({ id: ordenId })],
      etapas,
    });
    const app = await buildApp(configuracionPrueba(), dependencias);
    try {
      const respuesta = await app.inject({
        method: 'PATCH',
        url: `/api/ops/${ordenId}/etapas/${etapaId}`,
        payload: { completada: 'si' },
      });
      expect(respuesta.statusCode).toBe(422);
      expect(estado.escrituras).toEqual([]);
    } finally {
      await app.close();
    }
  });

  it('D5 el error handler traduce recursos faltantes a 404', async () => {
    const app = await buildApp(configuracionPrueba(), crearDependenciasFalsas().dependencias);
    app.get('/__prueba__/no-encontrado', async () => {
      throw new RecursoNoEncontradoError('recurso inexistente');
    });
    try {
      const respuesta = await app.inject({ method: 'GET', url: '/__prueba__/no-encontrado' });
      expect(respuesta.statusCode).toBe(404);
      expect(respuesta.json()).toMatchObject({ error: 'not_found', message: 'recurso inexistente' });
    } finally {
      await app.close();
    }
  });

  it('D5 /documentation/json publica los esquemas de querystring y de body', async () => {
    const app = await buildApp(configuracionPrueba(), crearDependenciasFalsas().dependencias);
    try {
      const documentacion = (await app.inject({ method: 'GET', url: '/documentation/json' })).json();
      const parametros = documentacion.paths['/api/ops'].get.parameters as {
        name: string;
      }[];
      expect(parametros.map((parametro) => parametro.name)).toContain('fechaDesde');
      expect(documentacion.paths['/api/ops/{id}/etapas/{etapaId}'].patch.requestBody).toBeDefined();
    } finally {
      await app.close();
    }
  });
});
