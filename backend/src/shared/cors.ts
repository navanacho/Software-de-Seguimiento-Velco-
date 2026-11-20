import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export function registrarCors(app: FastifyInstance, origen: string): void {
  app.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    if (origen.length > 0) {
      reply.header('access-control-allow-origin', origen);
      reply.header('vary', 'Origin');
    }

    if (request.method === 'OPTIONS') {
      reply.header('access-control-allow-methods', 'GET, OPTIONS');
      reply.header('access-control-allow-headers', 'content-type');
      await reply.code(204).send();
    }
  });
}
