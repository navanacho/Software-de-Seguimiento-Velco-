import swagger from '@fastify/swagger';
import Fastify from 'fastify';
import { RUTA_SALUD } from '@velco/domain';
import type { RespuestaSalud } from '@velco/domain';
import { registrarCors } from '../../../shared/cors.ts';
import type { ConfiguracionServidor } from '../../../shared/configuracion.ts';
import { crearDependenciasProduccion } from '../../../shared/dependencias.ts';
import type { DependenciasApi } from '../../../shared/dependencias.ts';
import { registrarRutasOrdenes } from '../../ordenes/http/registrarRutas.ts';
import { registrarRutasEtapas } from '../../etapas/http/registrarRutas.ts';
import { obtenerSalud } from '../application/obtenerSalud.ts';
import { ZodError, z } from 'zod';
import { RecursoNoEncontradoError } from '../../../shared/errores.ts';

const RespuestaSaludSchema = z.object({ estado: z.literal('ok') });

export async function buildApp(configuracion: ConfiguracionServidor, dependencias?: DependenciasApi) {
  const app = Fastify({ logger: false });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(422).send({
        error: 'validation_error',
        message: 'datos inválidos en la solicitud',
        details: error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }
    if (error instanceof RecursoNoEncontradoError) {
      return reply.code(404).send({ error: 'not_found', message: error.message });
    }
    return reply.send(error);
  });

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Velco API',
        version: '0.1.0',
        description: 'Fundación del MVP de seguimiento de órdenes de producción',
      },
    },
  });

  registrarCors(app, configuracion.origenCors);

  if (dependencias) {
    registrarRutasOrdenes(app, dependencias);
    registrarRutasEtapas(app, dependencias);
  }

  app.get('/documentation/json', async () => app.swagger());

  app.get(
    RUTA_SALUD,
    {
      schema: {
        description: 'Devuelve el estado operativo del servicio',
        tags: ['salud'],
        response: {
          200: z.toJSONSchema(RespuestaSaludSchema),
        },
      },
    },
    async (): Promise<RespuestaSalud> => RespuestaSaludSchema.parse(obtenerSalud()),
  );

  return app;
}

export async function iniciarServidor(configuracion: ConfiguracionServidor) {
  const app = await buildApp(configuracion, crearDependenciasProduccion(configuracion.zonaHoraria));
  await app.listen({ port: configuracion.puerto, host: '127.0.0.1' });
  return app;
}
