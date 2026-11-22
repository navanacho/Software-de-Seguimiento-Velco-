import type { FastifyInstance } from 'fastify';
import type { DependenciasApi } from '../../../shared/dependencias.ts';
import { RecursoNoEncontradoError } from '../../../shared/errores.ts';
import { preValidar, validar } from '../../../shared/validacion.ts';
import { actualizarCompletada } from '../application/actualizarCompletada.ts';
import { gestionarEtapas } from '../application/gestionarEtapas.ts';
import { TarjetaOrdenJSONSchema } from '../../ordenes/http/esquemas.ts';
import {
  BodyAltaEtapaJSONSchema,
  BodyAltaEtapaSchema,
  BodyPatchEtapaJSONSchema,
  BodyPatchEtapaSchema,
  BodyReordenEtapaJSONSchema,
  BodyReordenEtapaSchema,
  ParamsEtapaJSONSchema,
  ParamsEtapaSchema,
} from './esquemas.ts';
import { z } from 'zod';

export function registrarRutasEtapas(app: FastifyInstance, dependencias: DependenciasApi): void {
  app.patch(
    '/api/ops/:id/etapas/:etapaId',
    {
      schema: {
        description: 'Alterna la etapa completada de una orden',
        tags: ['etapas'],
        params: ParamsEtapaJSONSchema,
        body: BodyPatchEtapaJSONSchema,
        response: { 200: TarjetaOrdenJSONSchema },
      },
      preValidation: [
        preValidar(ParamsEtapaSchema, (request) => request.params),
        preValidar(BodyPatchEtapaSchema, (request) => request.body),
      ],
    },
    async (request) => {
      const { id, etapaId } = validar(ParamsEtapaSchema, request.params);
      const { completada } = validar(BodyPatchEtapaSchema, request.body);
      const tarjeta = await actualizarCompletada(dependencias, { ordenId: id, etapaId, completada });
      if (tarjeta === null) throw new RecursoNoEncontradoError('OP o etapa inexistente');
      return tarjeta;
    },
  );

  const ParamsOpSolo = z.object({ id: z.string().uuid() });
  const ParamsOpSoloJson = z.toJSONSchema(ParamsOpSolo, { target: 'draft-07' });
  app.post('/api/ops/:id/etapas', {
    schema: { tags: ['etapas'], params: ParamsOpSoloJson, body: BodyAltaEtapaJSONSchema },
    preValidation: [preValidar(ParamsOpSolo, (r) => r.params), preValidar(BodyAltaEtapaSchema, (r) => r.body)],
  }, async (request, reply) => {
    const { id } = validar(ParamsOpSolo, request.params);
    const body = validar(BodyAltaEtapaSchema, request.body);
    await gestionarEtapas(dependencias, id, { accion: 'alta', nombre: body.nombre, horasVendidas: body.horasVendidas ?? '0.00' });
    return reply.code(201).send({ ok: true });
  });

  app.patch('/api/ops/:id/etapas/:etapaId/orden', {
    schema: { tags: ['etapas'], params: ParamsEtapaJSONSchema, body: BodyReordenEtapaJSONSchema },
    preValidation: [preValidar(ParamsEtapaSchema, (r) => r.params), preValidar(BodyReordenEtapaSchema, (r) => r.body)],
  }, async (request) => {
    const { id, etapaId } = validar(ParamsEtapaSchema, request.params);
    const { ordenSecuencia } = validar(BodyReordenEtapaSchema, request.body);
    const actuales = await dependencias.etapas.listarPorOrden(id);
    if (!actuales.some((e) => e.id === etapaId)) throw new RecursoNoEncontradoError(`etapa ${etapaId} inexistente`);
    const ids = actuales.map((e) => e.id).filter((eid) => eid !== etapaId);
    const idx = Math.max(0, Math.min(ordenSecuencia - 1, ids.length));
    ids.splice(idx, 0, etapaId);
    await gestionarEtapas(dependencias, id, { accion: 'reorden', etapaIds: ids });
    return { ok: true };
  });

  app.delete('/api/ops/:id/etapas/:etapaId', {
    schema: { tags: ['etapas'], params: ParamsEtapaJSONSchema },
    preValidation: [preValidar(ParamsEtapaSchema, (r) => r.params)],
  }, async (request, reply) => {
    const { id, etapaId } = validar(ParamsEtapaSchema, request.params);
    await gestionarEtapas(dependencias, id, { accion: 'baja', etapaId });
    return reply.code(204).send();
  });
}
