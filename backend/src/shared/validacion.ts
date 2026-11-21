import type { FastifyRequest } from 'fastify';
import type { ZodType } from 'zod';

export function validar<T>(esquema: ZodType<T>, valor: unknown): T {
  return esquema.parse(valor);
}

export function preValidar<T>(esquema: ZodType<T>, fuente: (request: FastifyRequest) => unknown) {
  return async (request: FastifyRequest): Promise<void> => {
    esquema.parse(fuente(request));
  };
}
