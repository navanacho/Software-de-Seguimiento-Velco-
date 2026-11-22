import { EsquemaDetalleOp } from './esquemas.ts';
import { lanzarSiError } from './errores.ts';
import type { DetalleOpDTO } from './tipos.ts';

export interface ConsultaHttp {
  (url: string, init?: RequestInit): Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;
}

export async function consultarOp(ordenId: string, consulta: ConsultaHttp = fetch): Promise<DetalleOpDTO> {
  const respuesta = await consulta(`/api/ops/${ordenId}`);
  await lanzarSiError(respuesta);
  return EsquemaDetalleOp.parse(await respuesta.json());
}
