import type { FastifyInstance } from 'fastify';
import type { DependenciasApi } from '../../../shared/dependencias.ts';
import { preValidar, validar } from '../../../shared/validacion.ts';
import { actualizarConfiguracion } from '../application/actualizarConfiguracion.ts';
import {
  BodyConfiguracionJSONSchema,
  BodyConfiguracionSchema,
  ErrorValidacionJSONSchema,
  EsquemaConfiguracionJSON,
} from './esquemas.ts';

export function registrarRutasConfiguracion(app: FastifyInstance, dependencias: DependenciasApi): void {
  app.get('/api/configuracion', {
    schema: {
      tags: ['configuracion'],
      response: {
        200: EsquemaConfiguracionJSON,
        404: { type: 'object', additionalProperties: true },
      },
    },
  }, async (_request, reply) => {
    const configuracion = await dependencias.configuracion.obtener();
    if (!configuracion) {
      return reply.code(404).send({ error: 'not_found', message: 'No existe la fila singleton de configuración' });
    }
    return configuracion;
  });

  app.put('/api/configuracion', {
    schema: {
      tags: ['configuracion'],
      body: BodyConfiguracionJSONSchema,
      response: { 200: EsquemaConfiguracionJSON, 422: ErrorValidacionJSONSchema },
    },
    preValidation: [preValidar(BodyConfiguracionSchema, (request) => request.body)],
  }, async (request, reply) => {
    const cuerpo = validar(BodyConfiguracionSchema, request.body);
    const resultado = await actualizarConfiguracion(dependencias.configuracion, cuerpo);
    if (!resultado.valido) {
      return reply.code(422).send({
        error: 'validation_error',
        message: 'datos inválidos en la solicitud',
        details: resultado.errores.map((error) => ({ path: error.campo, message: error.mensaje })),
      });
    }
    return resultado.configuracion;
  });
}
