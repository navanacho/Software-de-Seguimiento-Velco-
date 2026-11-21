import { z } from 'zod';
import type { EstadoSemaforo, EtapaTarjeta, GrupoFlujo, TarjetaOrdenDTO } from '@velco/domain';
import type { KpisTablero, RespuestaListadoTablero } from './tipos.ts';

// Los valores espejan el tipo canónico porque @velco/domain exporta EstadoSemaforo como type, no como array runtime (R2 impide cambiar domain aquí).
export const ESTADOS = ['Terminado', 'Atrasado', 'En riesgo', 'En plazo'] as const satisfies readonly EstadoSemaforo[];

const EsquemaEtapaTarjeta: z.ZodType<EtapaTarjeta> = z.object({
  id: z.string(),
  nombre: z.string(),
  ordenSecuencia: z.number().int(),
  completada: z.boolean(),
});

export const EsquemaTarjetaOrden: z.ZodType<TarjetaOrdenDTO> = z.object({
  id: z.string(),
  numeroOp: z.string(),
  clienteId: z.string(),
  clienteNombre: z.string().nullable(),
  descripcionPieza: z.string(),
  etapas: z.array(EsquemaEtapaTarjeta),
  avance: z.number(),
  semaforo: z.enum(ESTADOS),
  diasRestantes: z.number(),
  etapaAhora: z.string(),
  etiquetaPlazo: z.string(),
});

export const EsquemaKpisTablero: z.ZodType<KpisTablero> = z.object({
  total: z.number().int(),
  porEstado: z.object({
    Terminado: z.number().int(),
    Atrasado: z.number().int(),
    'En riesgo': z.number().int(),
    'En plazo': z.number().int(),
  }),
});

const EsquemaGrupoFlujo: z.ZodType<GrupoFlujo> = z.object({
  etapa: z.string(),
  cantidad: z.number().int(),
});

export const EsquemaRespuestaListadoTablero: z.ZodType<RespuestaListadoTablero> = z.object({
  ops: z.array(EsquemaTarjetaOrden),
  kpis: EsquemaKpisTablero,
  flujo: z.array(EsquemaGrupoFlujo),
});
