import type { FastifyInstance } from 'fastify';
import type { DependenciasApi } from '../../../shared/dependencias.ts';
import { preValidar, validar } from '../../../shared/validacion.ts';
import { RecursoNoEncontradoError } from '../../../shared/errores.ts';
import { BodyAltaMaterialJSONSchema, BodyAltaMaterialSchema } from './esquemas.ts';
import { ParamsOpJSONSchema, ParamsOpSchema } from '../../ordenes/http/esquemas.ts';

export function registrarRutasMateriales(app: FastifyInstance, dependencias: DependenciasApi): void {
  app.post('/api/ops/:id/materiales', {
    schema: { tags: ['materiales'], params: ParamsOpJSONSchema, body: BodyAltaMaterialJSONSchema },
    preValidation: [preValidar(ParamsOpSchema, (r) => r.params), preValidar(BodyAltaMaterialSchema, (r) => r.body)],
  }, async (request, reply) => {
    const { id } = validar(ParamsOpSchema, request.params);
    const body = validar(BodyAltaMaterialSchema, request.body);
    const op = await dependencias.ops.buscarPorId(id);
    if (!op) throw new RecursoNoEncontradoError(`OP ${id} inexistente`);
    const [creado] = await dependencias.materiales.crearVarios(id, [{ ...body, unidad: body.unidad ?? null, costoUnitarioReal: body.costoUnitarioReal ?? null, nroRemito: body.nroRemito ?? null, nroFactura: body.nroFactura ?? null, nt: body.nt ?? null, po: body.po ?? null }]);
    return reply.code(201).send(creado);
  });
}
