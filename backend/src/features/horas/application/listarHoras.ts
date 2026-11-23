import type { RegistroHora } from '@velco/domain';
import { RecursoNoEncontradoError } from '../../../shared/errores.ts';
import type { UnidadTrabajoHoras } from './ports/UnidadTrabajoHoras.ts';

export async function listarHoras(
  ut: UnidadTrabajoHoras,
  ordenId: string,
): Promise<readonly RegistroHora[]> {
  return ut.ejecutar(async ({ horas, ops }) => {
    const op = await ops.buscarPorId(ordenId);
    if (!op) throw new RecursoNoEncontradoError(`OP ${ordenId} inexistente`);
    return horas.listarPorOrden(ordenId);
  });
}
