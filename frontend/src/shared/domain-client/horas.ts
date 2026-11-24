import { z } from 'zod';
import {
  EsquemaCargarHora,
  EsquemaEditarHora,
  EsquemaParteHora,
  type CargarHoraEntrada,
  type EditarHoraEntrada,
} from './esquemas.ts';
import { lanzarSiError } from './errores.ts';
import type { ConsultaHttp } from './consultarOp.ts';
import type { ParteHoraDTO } from './tipos.ts';

const EsquemaId = z.string().uuid();
const EsquemaBorrado = z.object({ ok: z.literal(true) }).strict();

function initJson(method: string, cuerpo: unknown): RequestInit {
  return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) };
}

export async function listarHoras(
  ordenId: string,
  consulta: ConsultaHttp = fetch,
): Promise<readonly ParteHoraDTO[]> {
  const id = EsquemaId.parse(ordenId);
  const respuesta = await consulta(`/api/ops/${id}/horas`);
  await lanzarSiError(respuesta);
  return z.array(EsquemaParteHora).parse(await respuesta.json());
}

export async function cargarHora(
  ordenId: string,
  cuerpo: CargarHoraEntrada,
  consulta: ConsultaHttp = fetch,
): Promise<ParteHoraDTO> {
  const id = EsquemaId.parse(ordenId);
  const validado = EsquemaCargarHora.parse(cuerpo);
  const respuesta = await consulta(`/api/ops/${id}/horas`, initJson('POST', validado));
  await lanzarSiError(respuesta);
  return EsquemaParteHora.parse(await respuesta.json());
}

export async function editarHora(
  ordenId: string,
  parteId: string,
  cuerpo: EditarHoraEntrada,
  consulta: ConsultaHttp = fetch,
): Promise<ParteHoraDTO> {
  const id = EsquemaId.parse(ordenId);
  const parte = EsquemaId.parse(parteId);
  const validado = EsquemaEditarHora.parse(cuerpo);
  const respuesta = await consulta(`/api/ops/${id}/horas/${parte}`, initJson('PATCH', validado));
  await lanzarSiError(respuesta);
  return EsquemaParteHora.parse(await respuesta.json());
}

export async function eliminarHora(
  ordenId: string,
  parteId: string,
  consulta: ConsultaHttp = fetch,
): Promise<void> {
  const id = EsquemaId.parse(ordenId);
  const parte = EsquemaId.parse(parteId);
  const respuesta = await consulta(`/api/ops/${id}/horas/${parte}`, { method: 'DELETE' });
  await lanzarSiError(respuesta);
  EsquemaBorrado.parse(await respuesta.json());
}
