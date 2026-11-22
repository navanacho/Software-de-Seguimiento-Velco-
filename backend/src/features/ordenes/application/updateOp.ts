import { normalizarCodigoPlano } from '@velco/domain';
import type { OrdenTrabajo } from '@velco/domain';
import type { DependenciasApi } from '../../../shared/dependencias.ts';
import { CodigoPlanoDuplicadoError, NumeroOpDuplicadoError, RecursoNoEncontradoError } from '../../../shared/errores.ts';

export interface ComandoActualizarOp {
  readonly numeroOp: string;
  readonly codigoPlano?: string | null;
  readonly clienteNombre: string;
  readonly descripcionPieza: string;
  readonly fechaEntrega: string;
  readonly montoVendido: string;
  readonly observaciones?: string | null;
}

export async function updateOp(deps: DependenciasApi, id: string, comando: ComandoActualizarOp): Promise<OrdenTrabajo> {
  const actual = await deps.ops.buscarPorId(id);
  if (!actual) throw new RecursoNoEncontradoError(`OP ${id} inexistente`);
  const codigoPlano = normalizarCodigoPlano(comando.codigoPlano);
  if (codigoPlano !== null) {
    const conflicto = await deps.ops.buscarPorCodigoPlano(codigoPlano, id);
    if (conflicto) throw new CodigoPlanoDuplicadoError(codigoPlano, { id: conflicto.id, numeroOp: conflicto.numeroOp });
  }
  if (comando.numeroOp !== actual.numeroOp) {
    const conflictoNum = await deps.ops.buscarPorNumeroOp(comando.numeroOp);
    if (conflictoNum && conflictoNum.id !== id) throw new NumeroOpDuplicadoError(comando.numeroOp);
  }
  const clienteNombre = comando.clienteNombre.trim();
  if (clienteNombre.length === 0) throw new Error('validation_error:clienteNombre');
  let cliente = await deps.clientes.buscarPorNombre(clienteNombre);
  if (!cliente) cliente = await deps.clientes.crear({ nombre: clienteNombre });

  const actualizada = await deps.ops.actualizar(id, {
    numeroOp: comando.numeroOp,
    codigoPlano,
    clienteId: cliente.id,
    descripcionPieza: comando.descripcionPieza,
    fechaEntrega: comando.fechaEntrega,
    montoVendido: comando.montoVendido,
    observaciones: comando.observaciones ?? null,
  });
  if (!actualizada) throw new RecursoNoEncontradoError(`OP ${id} inexistente`);
  return actualizada;
}
