import type { NuevoRegistroHora, RegistroHora } from '@velco/domain';
import { validarRegistroHora } from '@velco/domain';
import { EtapaInexistenteError, RegistroHoraNoEncontradoError } from '../../../shared/errores.ts';
import type { UnidadTrabajoHoras } from './ports/UnidadTrabajoHoras.ts';

export async function editarHora(
  ut: UnidadTrabajoHoras,
  ordenId: string,
  parteId: string,
  datos: Partial<Omit<NuevoRegistroHora, 'ordenId'>>,
): Promise<RegistroHora> {
  if (Object.keys(datos).length === 0) throw Object.assign(new Error('cuerpo vacío'), { name: 'BodyVacioError' });
  return ut.ejecutar(async ({ horas, etapas }) => {
    const actual = await horas.buscarPorId(parteId);
    if (!actual || actual.ordenId !== ordenId) throw new RegistroHoraNoEncontradoError();
    const fusion: NuevoRegistroHora = {
      ordenId,
      etapaId: datos.etapaId !== undefined ? datos.etapaId : actual.etapaId,
      operario: datos.operario ?? actual.operario,
      fecha: datos.fecha ?? actual.fecha,
      horas: datos.horas ?? actual.horas,
      observacion: datos.observacion !== undefined ? datos.observacion : actual.observacion ?? null,
    };
    const validacion = validarRegistroHora(fusion);
    if (!validacion.ok) throw Object.assign(new Error(validacion.error), { name: 'HorasInvalidasError' });
    if (fusion.etapaId) {
      const etapa = await etapas.buscarPorId(fusion.etapaId);
      if (!etapa || etapa.ordenId !== ordenId) throw new EtapaInexistenteError(fusion.etapaId);
    }
    const actualizado = await horas.actualizar(parteId, datos);
    if (!actualizado) throw new RegistroHoraNoEncontradoError();
    return actualizado;
  });
}


