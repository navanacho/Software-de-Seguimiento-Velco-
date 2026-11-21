import { EsquemaRespuestaListadoTablero } from './esquemas.ts';
import type { RespuestaListadoTablero } from './tipos.ts';

export interface FiltrosTablero {
  readonly clienteId?: string;
  readonly estado?: string;
  readonly etapaAhora?: string;
  readonly buscar?: string;
}

type ConsultaHttp = (url: string, init?: RequestInit) => Promise<{ ok: boolean; json(): Promise<unknown> }>;

export async function consultarTablero(
  filtros: FiltrosTablero,
  consulta: ConsultaHttp = fetch,
): Promise<RespuestaListadoTablero> {
  const params = new URLSearchParams();
  for (const [clave, valor] of Object.entries(filtros)) {
    if (typeof valor === 'string' && valor.trim() !== '') params.set(clave, valor);
  }
  const qs = params.toString();
  const url = `/api/ops${qs ? `?${qs}` : ''}`;
  const respuesta = await consulta(url);
  if (!respuesta.ok) {
    throw new Error('No se pudo consultar el tablero');
  }
  return EsquemaRespuestaListadoTablero.parse(await respuesta.json());
}
