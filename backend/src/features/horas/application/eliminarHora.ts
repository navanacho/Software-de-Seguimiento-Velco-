import { RegistroHoraNoEncontradoError } from '../../../shared/errores.ts';
import type { UnidadTrabajoHoras } from './ports/UnidadTrabajoHoras.ts';

export async function eliminarHora(ut: UnidadTrabajoHoras, ordenId: string, parteId: string): Promise<void> {
  await ut.ejecutar(async ({ horas }) => {
    const actual = await horas.buscarPorId(parteId);
    if (!actual || actual.ordenId !== ordenId) throw new RegistroHoraNoEncontradoError();
    await horas.eliminar(parteId);
  });
}


