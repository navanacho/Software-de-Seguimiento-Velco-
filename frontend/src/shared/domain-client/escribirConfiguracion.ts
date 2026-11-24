import { EsquemaBodyConfiguracion, EsquemaConfiguracion } from './configuracion.ts';
import type { BodyConfiguracion, ConfiguracionDTO } from './configuracion.ts';
import { lanzarSiError } from './errores.ts';

export interface ConsultaHttp {
  (url: string, init?: RequestInit): Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;
}

export async function consultarConfiguracion(consulta: ConsultaHttp = fetch): Promise<ConfiguracionDTO> {
  const respuesta = await consulta('/api/configuracion');
  await lanzarSiError(respuesta);
  return EsquemaConfiguracion.parse(await respuesta.json());
}

export async function guardarConfiguracion(
  cuerpo: BodyConfiguracion,
  consulta: ConsultaHttp = fetch,
): Promise<ConfiguracionDTO> {
  const validado = EsquemaBodyConfiguracion.parse(cuerpo);
  const respuesta = await consulta('/api/configuracion', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validado),
  });
  await lanzarSiError(respuesta);
  return EsquemaConfiguracion.parse(await respuesta.json());
}
