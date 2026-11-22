import type { EtapaOrden } from '@velco/domain';
import { nombreEtapaDuplicado } from '@velco/domain';
import type { DependenciasApi } from '../../../shared/dependencias.ts';
import { RecursoNoEncontradoError } from '../../../shared/errores.ts';

export type ComandoGestionEtapas =
  | { accion: 'alta'; nombre: string; horasVendidas?: string }
  | { accion: 'baja'; etapaId: string }
  | { accion: 'reorden'; etapaIds: readonly string[] };

export async function gestionarEtapas(deps: DependenciasApi, ordenId: string, comando: ComandoGestionEtapas): Promise<readonly EtapaOrden[]> {
  const op = await deps.ops.buscarPorId(ordenId);
  if (!op) throw new RecursoNoEncontradoError(`OP ${ordenId} inexistente`);
  const actuales = await deps.etapas.listarPorOrden(ordenId);

  if (comando.accion === 'alta') {
    const nombre = comando.nombre.trim();
    if (nombre.length === 0) throw new Error('validation_error:etapaNombre');
    if (nombreEtapaDuplicado(actuales.map((e) => e.nombre), nombre)) throw new Error('validation_error:etapaDuplicada');
    const siguiente = actuales.length === 0 ? 1 : Math.max(...actuales.map((e) => e.ordenSecuencia)) + 1;
    await deps.etapas.crearVarias(ordenId, [{ nombre, ordenSecuencia: siguiente, horasVendidas: comando.horasVendidas ?? '0.00' }]);
    return deps.etapas.listarPorOrden(ordenId);
  }

  if (comando.accion === 'baja') {
    const etapa = await deps.etapas.buscarPorId(comando.etapaId);
    if (!etapa || etapa.ordenId !== ordenId) throw new RecursoNoEncontradoError(`etapa ${comando.etapaId} inexistente en OP ${ordenId}`);
    await deps.etapas.eliminar(comando.etapaId);
    const restantes = (await deps.etapas.listarPorOrden(ordenId)).filter((e) => e.id !== comando.etapaId);
    for (let i = 0; i < restantes.length; i++) await deps.etapas.actualizarSecuencia(restantes[i]!.id, 1000 + i);
    for (let i = 0; i < restantes.length; i++) await deps.etapas.actualizarSecuencia(restantes[i]!.id, i + 1);
    return deps.etapas.listarPorOrden(ordenId);
  }

  if (comando.etapaIds.length !== actuales.length) throw new Error('validation_error:reorden');
  const porId = new Map(actuales.map((e) => [e.id, e]));
  for (const id of comando.etapaIds) {
    const e = porId.get(id);
    if (!e || e.ordenId !== ordenId) throw new RecursoNoEncontradoError(`etapa ${id} inexistente en OP ${ordenId}`);
  }
  for (let i = 0; i < comando.etapaIds.length; i++) await deps.etapas.actualizarSecuencia(comando.etapaIds[i]!, 1000 + i);
  for (let i = 0; i < comando.etapaIds.length; i++) await deps.etapas.actualizarSecuencia(comando.etapaIds[i]!, i + 1);
  return deps.etapas.listarPorOrden(ordenId);
}
