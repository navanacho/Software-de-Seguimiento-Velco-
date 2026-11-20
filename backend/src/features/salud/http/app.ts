import swagger from '@fastify/swagger';
import Fastify from 'fastify';
import { RUTA_SALUD } from '@velco/domain';
import type { RespuestaSalud } from '@velco/domain';
import { registrarCors } from '../../../shared/cors.ts';
import type { ConfiguracionServidor } from '../../../shared/configuracion.ts';
import { obtenerSalud } from '../application/obtenerSalud.ts';
import { z } from 'zod';

const RespuestaSaludSchema = z.object({ estado: z.literal('ok') });

export async function buildApp(configuracion: ConfiguracionServidor) {
  const app = Fastify({ logger: false });

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
  const app = await buildApp(configuracion);
  await app.listen({ port: configuracion.puerto, host: '127.0.0.1' });
  return app;
}
