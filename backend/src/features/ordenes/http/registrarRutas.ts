import type { FastifyInstance } from 'fastify';
import type { DependenciasApi } from '../../../shared/dependencias.ts';
import { RecursoNoEncontradoError } from '../../../shared/errores.ts';
import { preValidar, validar } from '../../../shared/validacion.ts';
import { listarOps } from '../application/listarOps.ts';
import { obtenerOp } from '../application/obtenerOp.ts';
import {
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
}
