import type { FastifyInstance } from 'fastify';
import type { DependenciasApi } from '../../../shared/dependencias.ts';
import { RecursoNoEncontradoError } from '../../../shared/errores.ts';
import { preValidar, validar } from '../../../shared/validacion.ts';
import { actualizarCompletada } from '../application/actualizarCompletada.ts';
import { TarjetaOrdenJSONSchema } from '../../ordenes/http/esquemas.ts';
import {
  BodyPatchEtapaJSONSchema,
  BodyPatchEtapaSchema,
  ParamsEtapaJSONSchema,
  ParamsEtapaSchema,
} from './esquemas.ts';

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
}
