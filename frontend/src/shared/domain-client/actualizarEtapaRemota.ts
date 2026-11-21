import { EsquemaTarjetaOrden } from './esquemas.ts';
import type { TarjetaOrdenDTO } from '@velco/domain';

export interface ComandoActualizarEtapa {
  readonly ordenId: string;
  readonly etapaId: string;
  readonly completada: boolean;
}

type ConsultaHttp = (url: string, init?: RequestInit) => Promise<{ ok: boolean; json(): Promise<unknown> }>;

export async function actualizarEtapaRemota(
  comando: ComandoActualizarEtapa,
  consulta: ConsultaHttp = fetch,
): Promise<TarjetaOrdenDTO> {
  const respuesta = await consulta(`/api/ops/${comando.ordenId}/etapas/${comando.etapaId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completada: comando.completada }),
  });
  if (!respuesta.ok) {
    throw new Error('No se pudo actualizar la etapa');
  }
  return EsquemaTarjetaOrden.parse(await respuesta.json());
}
