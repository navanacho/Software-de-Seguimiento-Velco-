import { validarRegistroHora, type NuevoRegistroHora, type RegistroHora } from '@velco/domain';
import { RecursoNoEncontradoError } from '../../../shared/errores.ts';
import { EtapaInexistenteError } from '../../../shared/errores.ts';
import type { UnidadTrabajoHoras } from './ports/UnidadTrabajoHoras.ts';

export async function registrarHora(
  ut: UnidadTrabajoHoras,
  ordenId: string,
  datos: Omit<NuevoRegistroHora, 'ordenId'>,
): Promise<RegistroHora> {
  const entrada: NuevoRegistroHora = { ...datos, ordenId };
  const validacion = validarRegistroHora(entrada);
  if (!validacion.ok) throw Object.assign(new Error(validacion.error), { name: 'HorasInvalidasError' });
  return ut.ejecutar(async ({ horas, ops, etapas }) => {
    const op = await ops.buscarPorId(ordenId);
    if (!op) throw new RecursoNoEncontradoError(`OP ${ordenId} inexistente`);
    if (entrada.etapaId) {
      const etapa = await etapas.buscarPorId(entrada.etapaId);
      if (!etapa || etapa.ordenId !== ordenId) throw new EtapaInexistenteError(entrada.etapaId);
    }
    return horas.crear(entrada);
  });
}


