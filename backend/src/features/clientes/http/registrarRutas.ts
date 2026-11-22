import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { DependenciasApi } from '../../../shared/dependencias.ts';
import { preValidar, validar } from '../../../shared/validacion.ts';

const BodyAltaCliente = z.object({ nombre: z.string().trim().min(1).max(150) }).strict();
const BodyAltaClienteJson = z.toJSONSchema(BodyAltaCliente, { target: 'draft-07' });
const RespuestaCliente = z.toJSONSchema(z.object({ id: z.string(), nombre: z.string(), createdAt: z.string() }), { target: 'draft-07' });

export function registrarRutasClientes(app: FastifyInstance, dependencias: DependenciasApi): void {
  app.post('/api/clientes', {
    schema: { tags: ['clientes'], body: BodyAltaClienteJson, response: { 200: RespuestaCliente, 201: RespuestaCliente } },
    preValidation: [preValidar(BodyAltaCliente, (r) => r.body)],
  }, async (request, reply) => {
    const { nombre } = validar(BodyAltaCliente, request.body);
    const existente = await dependencias.clientes.buscarPorNombre(nombre);
    if (existente) return reply.code(200).send(existente);
    const cliente = await dependencias.clientes.crear({ nombre });
    return reply.code(201).send(cliente);
  });
}
