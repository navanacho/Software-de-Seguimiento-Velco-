import type { FastifyInstance } from 'fastify';
import type { DependenciasApi } from '../../../shared/dependencias.ts';
import { preValidar, validar } from '../../../shared/validacion.ts';
import { EtapaInexistenteError, RegistroHoraNoEncontradoError } from '../../../shared/errores.ts';
import { ParamsOpSchema, ParamsOpJSONSchema } from '../../ordenes/http/esquemas.ts';
import { listarHoras } from '../application/listarHoras.ts';
import { registrarHora } from '../application/registrarHora.ts';
import { editarHora } from '../application/editarHora.ts';
import { eliminarHora } from '../application/eliminarHora.ts';
import {
  BodyCrearHoraJSONSchema,
  BodyCrearHoraSchema,
  BodyEditarHoraJSONSchema,
  BodyEditarHoraSchema,
  ParamsOpHoraJSONSchema,
  ParamsOpHoraSchema,
  ParteHoraJSONSchema,
  RespuestaEliminarHoraJSONSchema,
  RespuestaListarHorasJSONSchema,
} from './esquemas.ts';

export function registrarRutasHoras(app: FastifyInstance, dependencias: DependenciasApi): void {
  app.get('/api/ops/:id/horas', {
    schema: { tags: ['horas'], params: ParamsOpJSONSchema, response: { 200: RespuestaListarHorasJSONSchema, 404: { type: 'object', additionalProperties: true } } },
    preValidation: [preValidar(ParamsOpSchema, (r) => r.params)],
  }, async (request) => {
    const { id } = validar(ParamsOpSchema, request.params);
    return listarHoras(dependencias.unidadTrabajoHoras, id);
  });

  app.post('/api/ops/:id/horas', {
    schema: { tags: ['horas'], params: ParamsOpJSONSchema, body: BodyCrearHoraJSONSchema, response: { 201: ParteHoraJSONSchema, 404: { type: 'object', additionalProperties: true }, 422: { type: 'object', additionalProperties: true } } },
    preValidation: [preValidar(ParamsOpSchema, (r) => r.params), preValidar(BodyCrearHoraSchema, (r) => r.body)],
  }, async (request, reply) => {
    const { id } = validar(ParamsOpSchema, request.params);
    const body = validar(BodyCrearHoraSchema, request.body);
    try {
      const creado = await registrarHora(dependencias.unidadTrabajoHoras, id, {
        etapaId: body.etapaId ?? null,
        operario: body.operario,
        fecha: body.fecha,
        horas: body.horas,
        observacion: body.observacion ?? null,
      });
      return reply.code(201).send(creado);
    } catch (error: unknown) {
      if (error instanceof EtapaInexistenteError) {
        return reply.code(422).send({ error: 'validation_error', message: error.message, details: [{ path: ['etapaId'], message: error.message }] });
      }
      if (error instanceof Error && error.name === 'HorasInvalidasError') {
        return reply.code(422).send({ error: 'validation_error', message: error.message, details: [{ path: ['horas'], message: error.message }] });
      }
      throw error;
    }
  });

  app.patch('/api/ops/:id/horas/:parteId', {
    schema: { tags: ['horas'], params: ParamsOpHoraJSONSchema, body: BodyEditarHoraJSONSchema, response: { 200: ParteHoraJSONSchema, 404: { type: 'object', additionalProperties: true }, 422: { type: 'object', additionalProperties: true } } },
    preValidation: [preValidar(ParamsOpHoraSchema, (r) => r.params), preValidar(BodyEditarHoraSchema, (r) => r.body)],
  }, async (request, reply) => {
    const { id, parteId } = validar(ParamsOpHoraSchema, request.params);
    const body = validar(BodyEditarHoraSchema, request.body);
    try {
      const actualizado = await editarHora(dependencias.unidadTrabajoHoras, id, parteId, {
        ...(body.etapaId !== undefined ? { etapaId: body.etapaId } : {}),
        ...(body.operario !== undefined ? { operario: body.operario } : {}),
        ...(body.fecha !== undefined ? { fecha: body.fecha } : {}),
        ...(body.horas !== undefined ? { horas: body.horas } : {}),
        ...(body.observacion !== undefined ? { observacion: body.observacion } : {}),
      });
      return reply.send(actualizado);
    } catch (error: unknown) {
      if (error instanceof RegistroHoraNoEncontradoError) return reply.code(404).send({ error: 'not_found', message: error.message });
      if (error instanceof EtapaInexistenteError) {
        return reply.code(422).send({ error: 'validation_error', message: error.message, details: [{ path: ['etapaId'], message: error.message }] });
      }
      if (error instanceof Error && (error.name === 'HorasInvalidasError' || error.name === 'BodyVacioError')) {
        return reply.code(422).send({ error: 'validation_error', message: error.message, details: [{ path: ['body'], message: error.message }] });
      }
      throw error;
    }
  });

  app.delete('/api/ops/:id/horas/:parteId', {
    schema: { tags: ['horas'], params: ParamsOpHoraJSONSchema, response: { 200: RespuestaEliminarHoraJSONSchema, 404: { type: 'object', additionalProperties: true } } },
    preValidation: [preValidar(ParamsOpHoraSchema, (r) => r.params)],
  }, async (request, reply) => {
    const { id, parteId } = validar(ParamsOpHoraSchema, request.params);
    try {
      await eliminarHora(dependencias.unidadTrabajoHoras, id, parteId);
      return reply.send({ ok: true });
    } catch (error: unknown) {
      if (error instanceof RegistroHoraNoEncontradoError) return reply.code(404).send({ error: 'not_found', message: error.message });
      throw error;
    }
  });
}
