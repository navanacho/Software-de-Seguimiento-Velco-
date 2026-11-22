import { z } from 'zod';

const EsquemaOpExistente = z.object({ id: z.string(), numeroOp: z.string() });
const EsquemaDetalleValidacion = z.object({ path: z.string(), message: z.string() });

export const EsquemaErrorPlanoDuplicado = z.object({
  error: z.literal('codigo_plano_duplicado'),
  message: z.string(),
  codigoPlano: z.string(),
  opExistente: EsquemaOpExistente,
}).strict();

export const EsquemaErrorNumeroOpDuplicado = z.object({
  error: z.literal('numero_op_duplicado'),
  message: z.string(),
  numeroOp: z.string(),
}).strict();

export const EsquemaErrorValidacion = z.object({
  error: z.literal('validation_error'),
  message: z.string(),
  details: z.array(EsquemaDetalleValidacion),
}).strict();

export const EsquemaErrorNoEncontrado = z.object({
  error: z.literal('not_found'),
  message: z.string(),
}).strict();

export type ErrorPlanoDuplicado = {
  readonly tipo: 'codigo_plano_duplicado';
  readonly message: string;
  readonly codigoPlano: string;
  readonly opExistente: { readonly id: string; readonly numeroOp: string };
};

export type ErrorNumeroOpDuplicado = {
  readonly tipo: 'numero_op_duplicado';
  readonly message: string;
  readonly numeroOp: string;
};

export type ErrorValidacion = {
  readonly tipo: 'validation_error';
  readonly message: string;
  readonly detalles: readonly { readonly path: string; readonly message: string }[];
};

export type ErrorNoEncontrado = {
  readonly tipo: 'not_found';
  readonly message: string;
};

export type ErrorDesconocido = {
  readonly tipo: 'desconocido';
  readonly message: string;
};

export type CausaErrorApi =
  | ErrorPlanoDuplicado
  | ErrorNumeroOpDuplicado
  | ErrorValidacion
  | ErrorNoEncontrado
  | ErrorDesconocido;

function mensajeGenerico(cuerpo: unknown, status: number): string {
  if (typeof cuerpo === 'object' && cuerpo !== null && 'message' in cuerpo) {
    const mensaje = (cuerpo as { message: unknown }).message;
    if (typeof mensaje === 'string' && mensaje.trim() !== '') return mensaje;
  }
  return `Error ${status} en la solicitud`;
}

export function interpretarErrorHTTP(status: number, cuerpo: unknown): CausaErrorApi {
  if (status === 409) {
    const plano = EsquemaErrorPlanoDuplicado.safeParse(cuerpo);
    if (plano.success) {
      return {
        tipo: 'codigo_plano_duplicado',
        message: plano.data.message,
        codigoPlano: plano.data.codigoPlano,
        opExistente: plano.data.opExistente,
      };
    }
    const numero = EsquemaErrorNumeroOpDuplicado.safeParse(cuerpo);
    if (numero.success) {
      return { tipo: 'numero_op_duplicado', message: numero.data.message, numeroOp: numero.data.numeroOp };
    }
  }
  if (status === 422) {
    const validacion = EsquemaErrorValidacion.safeParse(cuerpo);
    if (validacion.success) {
      return {
        tipo: 'validation_error',
        message: validacion.data.message,
        detalles: validacion.data.details,
      };
    }
  }
  if (status === 404) {
    const noEncontrado = EsquemaErrorNoEncontrado.safeParse(cuerpo);
    if (noEncontrado.success) {
      return { tipo: 'not_found', message: noEncontrado.data.message };
    }
  }
  return { tipo: 'desconocido', message: mensajeGenerico(cuerpo, status) };
}

export class ErrorApi extends Error {
  readonly causa: CausaErrorApi;

  constructor(causa: CausaErrorApi) {
    super(causa.message);
    this.name = 'ErrorApi';
    this.causa = causa;
  }
}

export async function lanzarSiError(respuesta: {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}): Promise<void> {
  if (respuesta.ok) return;
  const cuerpo = await respuesta.json().catch(() => null);
  throw new ErrorApi(interpretarErrorHTTP(respuesta.status, cuerpo));
}
