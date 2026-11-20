import { RUTA_SALUD } from '@velco/domain';
import { z } from 'zod';

export const CLAVE_SALUD = ['salud'] as const;

type ConsultaHttp = (url: string) => Promise<{ ok: boolean; json(): Promise<unknown> }>;

const EsquemaRespuestaSalud = z.object({ estado: z.literal('ok') });

export async function consultarSalud(consulta: ConsultaHttp = fetch) {
  const respuesta = await consulta(RUTA_SALUD);
  if (!respuesta.ok) {
    throw new Error('No se pudo consultar el estado del servicio');
  }
  return EsquemaRespuestaSalud.parse(await respuesta.json());
}
