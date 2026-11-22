import { z } from 'zod';
import {
  EsquemaActualizarOp,
  EsquemaAltaCliente,
  EsquemaAltaEtapa,
  EsquemaAltaMaterial,
  EsquemaCrearOp,
  EsquemaDetalleOp,
  EsquemaMaterialDetalle,
  EsquemaReordenEtapa,
  type AltaEtapaEntrada,
  type AltaMaterialEntrada,
  type ActualizarOpEntrada,
  type CrearOpEntrada,
} from './esquemas.ts';
import { lanzarSiError } from './errores.ts';
import type { ClienteCreado, DetalleOpDTO, MaterialDetalleDTO } from './tipos.ts';

export interface ConsultaHttp {
  (url: string, init?: RequestInit): Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;
}

const EsquemaClienteCreado = EsquemaAltaCliente.extend({ id: z.string(), createdAt: z.string() });

function initJson(method: string, cuerpo: unknown): RequestInit {
  return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) };
}

export async function crearOp(cuerpo: CrearOpEntrada, consulta: ConsultaHttp = fetch): Promise<DetalleOpDTO> {
  const validado = EsquemaCrearOp.parse(cuerpo);
  const respuesta = await consulta('/api/ops', initJson('POST', validado));
  await lanzarSiError(respuesta);
  return EsquemaDetalleOp.parse(await respuesta.json());
}

export async function actualizarOp(
  ordenId: string,
  cuerpo: ActualizarOpEntrada,
  consulta: ConsultaHttp = fetch,
): Promise<DetalleOpDTO> {
  const validado = EsquemaActualizarOp.parse(cuerpo);
  const respuesta = await consulta(`/api/ops/${ordenId}`, initJson('PUT', validado));
  await lanzarSiError(respuesta);
  return EsquemaDetalleOp.parse(await respuesta.json());
}

export async function altaCliente(nombre: string, consulta: ConsultaHttp = fetch): Promise<ClienteCreado> {
  const validado = EsquemaAltaCliente.parse({ nombre });
  const respuesta = await consulta('/api/clientes', initJson('POST', validado));
  await lanzarSiError(respuesta);
  return EsquemaClienteCreado.parse(await respuesta.json());
}

export async function altaEtapa(
  ordenId: string,
  cuerpo: AltaEtapaEntrada,
  consulta: ConsultaHttp = fetch,
): Promise<void> {
  const validado = EsquemaAltaEtapa.parse(cuerpo);
  const respuesta = await consulta(`/api/ops/${ordenId}/etapas`, initJson('POST', validado));
  await lanzarSiError(respuesta);
}

export async function reordenarEtapa(
  ordenId: string,
  etapaId: string,
  ordenSecuencia: number,
  consulta: ConsultaHttp = fetch,
): Promise<void> {
  const validado = EsquemaReordenEtapa.parse({ ordenSecuencia });
  const respuesta = await consulta(`/api/ops/${ordenId}/etapas/${etapaId}/orden`, initJson('PATCH', validado));
  await lanzarSiError(respuesta);
}

export async function bajaEtapa(ordenId: string, etapaId: string, consulta: ConsultaHttp = fetch): Promise<void> {
  const respuesta = await consulta(`/api/ops/${ordenId}/etapas/${etapaId}`, { method: 'DELETE' });
  await lanzarSiError(respuesta);
}

export async function altaMaterial(
  ordenId: string,
  cuerpo: AltaMaterialEntrada,
  consulta: ConsultaHttp = fetch,
): Promise<MaterialDetalleDTO> {
  const validado = EsquemaAltaMaterial.parse(cuerpo);
  const respuesta = await consulta(`/api/ops/${ordenId}/materiales`, initJson('POST', validado));
  await lanzarSiError(respuesta);
  return EsquemaMaterialDetalle.parse(await respuesta.json());
}
