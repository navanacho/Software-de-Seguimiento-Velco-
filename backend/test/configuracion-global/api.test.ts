import { describe, expect, it, vi } from 'vitest';
import { conAppReal, hayDocker } from '../tablero-read-api/ayuda.ts';

describe.skipIf(!hayDocker())('API /api/configuracion con PostgreSQL real', () => {
  it('GET devuelve la fila sembrada con sus defaults', async () => {
    await conAppReal(async ({ app }) => {
      const respuesta = await app.inject({ method: 'GET', url: '/api/configuracion' });
      expect(respuesta.statusCode).toBe(200);
      expect(respuesta.json()).toEqual({
        id: 1,
        valorHoraEstandar: '0.00',
        diasAlertaRiesgo: 3,
        porcentajeAvanceRiesgo: 80,
        etapasDefault: ['Corte', 'Soldadura', 'Mecanizado', 'Pintura', 'Entrega'],
      });
    });
  });

  it('PUT reemplaza el singleton y el GET posterior devuelve los valores normalizados', async () => {
    await conAppReal(async ({ app }) => {
      const respuesta = await app.inject({
        method: 'PUT',
        url: '/api/configuracion',
        payload: {
          valorHoraEstandar: '1250.5',
          diasAlertaRiesgo: 5,
          porcentajeAvanceRiesgo: 60,
          etapasDefault: ['Corte', 'Plegado', 'Entrega'],
        },
      });
      expect(respuesta.statusCode).toBe(200);
      expect(respuesta.json()).toMatchObject({
        valorHoraEstandar: '1250.50',
        diasAlertaRiesgo: 5,
        porcentajeAvanceRiesgo: 60,
        etapasDefault: ['Corte', 'Plegado', 'Entrega'],
      });
      const relectura = await app.inject({ method: 'GET', url: '/api/configuracion' });
      expect(relectura.statusCode).toBe(200);
      expect(relectura.json()).toEqual(respuesta.json());
    });
  });

  it('Cuerpo con id rechazado: 422 asociado a id sin modificar la fila', async () => {
    await conAppReal(async ({ app }) => {
      const respuesta = await app.inject({
        method: 'PUT',
        url: '/api/configuracion',
        payload: {
          id: 1,
          valorHoraEstandar: '1250.50',
          diasAlertaRiesgo: 5,
          porcentajeAvanceRiesgo: 60,
          etapasDefault: ['Corte', 'Plegado'],
        },
      });
      expect(respuesta.statusCode).toBe(422);
      const cuerpo = respuesta.json();
      expect(cuerpo.error).toBe('validation_error');
      expect(cuerpo.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: 'id', message: expect.stringContaining('id') }),
        ]),
      );
      const actual = await app.inject({ method: 'GET', url: '/api/configuracion' });
      expect(actual.json().valorHoraEstandar).toBe('0.00');
    });
  });

  it('TRIANGULA: reporta otra clave desconocida y conserva el camino válido', async () => {
    await conAppReal(async ({ app, dependencias }) => {
      const base = {
        valorHoraEstandar: '12.50',
        diasAlertaRiesgo: 2,
        porcentajeAvanceRiesgo: 70,
        etapasDefault: ['Corte'],
      };
      const rechazada = await app.inject({
        method: 'PUT', url: '/api/configuracion', payload: { ...base, foo: 'bar' },
      });
      expect(rechazada.statusCode).toBe(422);
      expect(rechazada.json().details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: 'foo', message: expect.stringContaining('foo') }),
        ]),
      );
      const escrituras = vi.spyOn(dependencias.configuracion, 'actualizar');
      expect(escrituras).not.toHaveBeenCalled();
      const valida = await app.inject({ method: 'PUT', url: '/api/configuracion', payload: base });
      expect(valida.statusCode).toBe(200);
      expect(escrituras).toHaveBeenCalledTimes(1);
      const actual = await app.inject({ method: 'GET', url: '/api/configuracion' });
      expect(actual.json().valorHoraEstandar).toBe('12.50');
      vi.restoreAllMocks();
    });
  });

  it('TRIANGULA: rechaza rangos inválidos sin escribir', async () => {
    await conAppReal(async ({ app }) => {
      const base = {
        valorHoraEstandar: '12.50',
        diasAlertaRiesgo: 2,
        porcentajeAvanceRiesgo: 70,
        etapasDefault: ['Corte', 'Entrega'],
      };
      const casos = [
        { ...base, valorHoraEstandar: '-1.00' },
        { ...base, diasAlertaRiesgo: -1 },
        { ...base, porcentajeAvanceRiesgo: 101 },
        { ...base, porcentajeAvanceRiesgo: -1 },
      ];
      for (const payload of casos) {
        const respuesta = await app.inject({ method: 'PUT', url: '/api/configuracion', payload });
        expect(respuesta.statusCode).toBe(422);
      }
      const negativo = await app.inject({
        method: 'PUT', url: '/api/configuracion', payload: casos[0]!,
      });
      expect(negativo.json().details).toEqual(
        expect.arrayContaining([expect.objectContaining({ path: 'valorHoraEstandar' })]),
      );
      const actual = await app.inject({ method: 'GET', url: '/api/configuracion' });
      expect(actual.json().valorHoraEstandar).toBe('0.00');
    });
  });

  it('TRIANGULA: rechaza tipos incorrectos y exceso de decimales', async () => {
    await conAppReal(async ({ app }) => {
      const respuestaDias = await app.inject({
        method: 'PUT',
        url: '/api/configuracion',
        payload: {
          valorHoraEstandar: '12.50', diasAlertaRiesgo: 'tres', porcentajeAvanceRiesgo: 70,
          etapasDefault: ['Corte'],
        },
      });
      const respuestaNumero = await app.inject({
        method: 'PUT',
        url: '/api/configuracion',
        payload: {
          valorHoraEstandar: 12.5, diasAlertaRiesgo: 2, porcentajeAvanceRiesgo: 70,
          etapasDefault: ['Corte'],
        },
      });
      const respuestaDecimales = await app.inject({
        method: 'PUT',
        url: '/api/configuracion',
        payload: {
          valorHoraEstandar: '12.345', diasAlertaRiesgo: 2, porcentajeAvanceRiesgo: 70,
          etapasDefault: ['Corte'],
        },
      });
      expect(respuestaDias.statusCode).toBe(422);
      expect(respuestaNumero.statusCode).toBe(422);
      expect(respuestaDecimales.statusCode).toBe(422);
      const actual = await app.inject({ method: 'GET', url: '/api/configuracion' });
      expect(actual.json().valorHoraEstandar).toBe('0.00');
    });
  });

  it('TRIANGULA: rechaza plantillas inválidas y acepta los límites inclusive', async () => {
    await conAppReal(async ({ app }) => {
      const base = {
        valorHoraEstandar: '12.50', diasAlertaRiesgo: 2, porcentajeAvanceRiesgo: 70,
      };
      for (const etapasDefault of [[], ['Corte', '  '], ['Corte', 'CORTE'], ['x'.repeat(101)]]) {
        const respuesta = await app.inject({
          method: 'PUT', url: '/api/configuracion', payload: { ...base, etapasDefault },
        });
        expect(respuesta.statusCode).toBe(422);
      }
      const invalida = await app.inject({
        method: 'PUT',
        url: '/api/configuracion',
        payload: { ...base, etapasDefault: ['Corte', 'CORTE'] },
      });
      expect(invalida.json().details).toEqual(
        expect.arrayContaining([expect.objectContaining({ path: 'etapasDefault.1' })]),
      );
      const limite = await app.inject({
        method: 'PUT',
        url: '/api/configuracion',
        payload: {
          valorHoraEstandar: '0.00', diasAlertaRiesgo: 0, porcentajeAvanceRiesgo: 100,
          etapasDefault: ['Corte'],
        },
      });
      expect(limite.statusCode).toBe(200);
      expect(limite.json()).toMatchObject({
        valorHoraEstandar: '0.00', diasAlertaRiesgo: 0, porcentajeAvanceRiesgo: 100, etapasDefault: ['Corte'],
      });
    });
  });
});
