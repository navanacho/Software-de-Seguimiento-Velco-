import type { FastifyInstance } from 'fastify';
import type { DependenciasApi } from '../../../shared/dependencias.ts';
import { RecursoNoEncontradoError } from '../../../shared/errores.ts';
import { preValidar, validar } from '../../../shared/validacion.ts';
import { listarOps } from '../application/listarOps.ts';
import { obtenerOp } from '../application/obtenerOp.ts';
import { createOp } from '../application/createOp.ts';
import { updateOp } from '../application/updateOp.ts';
import {
  BodyCreateOpJSONSchema,
  BodyCreateOpSchema,
  BodyUpdateOpJSONSchema,
  BodyUpdateOpSchema,
  ConflictoNumeroOpJSONSchema,
  ConflictoPlanoJSONSchema,
  ConsultaListadoOpsJSONSchema,
  ConsultaListadoOpsSchema,
  DetalleOpJSONSchema,
  ParamsOpJSONSchema,
  ParamsOpSchema,
  RespuestaListadoOpsJSONSchema,
} from './esquemas.ts';

export function registrarRutasOrdenes(app: FastifyInstance, dependencias: DependenciasApi): void {
  app.get(
    '/api/ops',
    {
      schema: {
        description: 'Listado de órdenes de trabajo del tablero',
        tags: ['ordenes'],
        querystring: ConsultaListadoOpsJSONSchema,
        response: { 200: RespuestaListadoOpsJSONSchema },
      },
      preValidation: preValidar(ConsultaListadoOpsSchema, (request) => request.query),
    },
    async (request) =>
      listarOps(dependencias, validar(ConsultaListadoOpsSchema, request.query)),
  );

  app.get(
    '/api/ops/:id',
    {
      schema: {
        description: 'Detalle de una orden de trabajo',
        tags: ['ordenes'],
        params: ParamsOpJSONSchema,
        response: { 200: DetalleOpJSONSchema },
      },
      preValidation: preValidar(ParamsOpSchema, (request) => request.params),
    },
    async (request) => {
      const { id } = validar(ParamsOpSchema, request.params);
      const detalle = await obtenerOp(dependencias, id);
      if (detalle === null) throw new RecursoNoEncontradoError(`OP ${id} inexistente`);
      return detalle;
    },
  );

  app.post('/api/ops', {
    schema: { tags: ['ordenes'], body: BodyCreateOpJSONSchema, response: { 201: DetalleOpJSONSchema, 409: ConflictoPlanoJSONSchema } },
    preValidation: [preValidar(BodyCreateOpSchema, (r) => r.body)],
  }, async (request, reply) => {
    const body = validar(BodyCreateOpSchema, request.body);
    const res = await createOp(dependencias, {
      ...body,
      codigoPlano: body.codigoPlano ?? null,
      observaciones: body.observaciones ?? null,
      etapas: (body.etapas ?? []).map((e) => ({ nombre: e.nombre, ...(e.horasVendidas !== undefined ? { horasVendidas: e.horasVendidas } : {}) })),
    });
    const detalle = await obtenerOp(dependencias, res.op.id);
    return reply.code(201).send(detalle);
  });

  app.put('/api/ops/:id', {
    schema: { tags: ['ordenes'], params: ParamsOpJSONSchema, body: BodyUpdateOpJSONSchema, response: { 200: DetalleOpJSONSchema, 409: ConflictoNumeroOpJSONSchema } },
    preValidation: [preValidar(ParamsOpSchema, (r) => r.params), preValidar(BodyUpdateOpSchema, (r) => r.body)],
  }, async (request) => {
    const { id } = validar(ParamsOpSchema, request.params);
    const body = validar(BodyUpdateOpSchema, request.body);
    await updateOp(dependencias, id, {
      ...body,
      codigoPlano: body.codigoPlano ?? null,
      observaciones: body.observaciones ?? null,
    });
    const detalle = await obtenerOp(dependencias, id);
    if (detalle === null) throw new RecursoNoEncontradoError(`OP ${id} inexistente`);
    return detalle;
  });
}
