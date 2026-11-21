import { construirTarjetaOrden, type TarjetaOrdenDTO } from '@velco/domain';
import type { DependenciasApi } from '../../../shared/dependencias.ts';
import { contextoTarjeta } from '../../configuracion/application/contextoTarjeta.ts';

export interface ComandoActualizarCompletada {
  readonly ordenId: string;
  readonly etapaId: string;
  readonly completada: boolean;
}

export async function actualizarCompletada(
  dependencias: DependenciasApi,
  comando: ComandoActualizarCompletada,
): Promise<TarjetaOrdenDTO | null> {
  const orden = await dependencias.ops.buscarPorId(comando.ordenId);
  if (orden === null) return null;
  const etapa = await dependencias.etapas.buscarPorId(comando.etapaId);
  if (etapa === null || etapa.ordenId !== comando.ordenId) return null;
  const actualizada = await dependencias.etapas.actualizarCompletada(
    comando.etapaId,
    comando.completada,
  );
  if (actualizada === null) return null;
  const etapas = await dependencias.etapas.listarPorOrden(comando.ordenId);
  const cliente = await dependencias.clientes.buscarPorId(orden.clienteId);
  const contexto = await contextoTarjeta(
    {
      configuracion: dependencias.configuracion,
      reloj: dependencias.reloj,
      zonaHoraria: dependencias.zonaHoraria,
    },
    cliente?.nombre ?? null,
  );
  return construirTarjetaOrden(orden, etapas, contexto);
}
