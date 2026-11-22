import { z } from 'zod';
import { TIPOS_MATERIAL } from '@velco/domain';
import type { EstadoSemaforo, EtapaTarjeta, GrupoFlujo, TarjetaOrdenDTO } from '@velco/domain';
import type { DetalleOpDTO, KpisTablero, RespuestaListadoTablero } from './tipos.ts';

// Los valores espejan el tipo canónico porque @velco/domain exporta EstadoSemaforo como type, no como array runtime (R2 impide cambiar domain aquí).
export const ESTADOS = ['Terminado', 'Atrasado', 'En riesgo', 'En plazo'] as const satisfies readonly EstadoSemaforo[];

const EsquemaEtapaTarjetaBase = z.object({
  id: z.string(),
  nombre: z.string(),
  ordenSecuencia: z.number().int(),
  completada: z.boolean(),
});

const EsquemaEtapaTarjeta: z.ZodType<EtapaTarjeta> = EsquemaEtapaTarjetaBase;

const EsquemaTarjetaOrdenBase = z.object({
  id: z.string(),
  numeroOp: z.string(),
  codigoPlano: z.string().max(80).nullable(),
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

export const EsquemaTarjetaOrden: z.ZodType<TarjetaOrdenDTO> = EsquemaTarjetaOrdenBase;

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

export const EsquemaFiltrosListadoOps = z.object({
  buscar: z.string().optional(),
  estados: z.array(z.enum(ESTADOS)).optional(),
  flujo: z.string().optional(),
  conPlano: z.union([z.literal('true'), z.literal('false')]).transform((v) => v === 'true').optional(),
}).strict();

const Decimal = z.string().regex(/^\d+(\.\d+)?$/);
const DecimalPositivo = Decimal.refine((valor) => Number(valor) > 0);
const DecimalNoNegativo = Decimal.refine((valor) => Number(valor) >= 0);
const FechaCalendario = z.string().refine((valor) => {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  if (!partes) return false;
  const anio = Number(partes[1]);
  const mes = Number(partes[2]);
  const dia = Number(partes[3]);
  if (mes < 1 || mes > 12 || dia < 1) return false;
  const bisiesto = anio % 4 === 0 && (anio % 100 !== 0 || anio % 400 === 0);
  const diasPorMes = [31, bisiesto ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return dia <= (diasPorMes[mes - 1] ?? 0);
}, 'fecha calendaria inválida');
const TextoOpcional50 = z.string().trim().max(50).optional().nullable();

export const EsquemaAltaMaterial = z.object({
  tipo: z.enum(TIPOS_MATERIAL),
  descripcion: z.string().trim().min(1),
  cantidad: DecimalPositivo,
  unidad: z.string().trim().max(20).optional().nullable(),
  costoUnitarioCotizado: DecimalNoNegativo,
  costoUnitarioReal: DecimalNoNegativo.optional().nullable(),
  nroRemito: TextoOpcional50,
  nroFactura: TextoOpcional50,
  nt: TextoOpcional50,
  po: TextoOpcional50,
}).strict();

export const EsquemaAltaEtapa = z.object({
  nombre: z.string().trim().min(1).max(100),
  horasVendidas: z.string().optional(),
}).strict();

export const EsquemaReordenEtapa = z.object({
  ordenSecuencia: z.number().int().min(1),
}).strict();

const EncabezadoOp = {
  numeroOp: z.string().trim().min(1).max(50),
  codigoPlano: z.string().max(80).optional().nullable(),
  clienteNombre: z.string().trim().min(1).max(150),
  descripcionPieza: z.string().trim().min(1),
  fechaEntrega: FechaCalendario,
  montoVendido: Decimal,
  observaciones: z.string().optional().nullable(),
};

export const EsquemaCrearOp = z.object({
  ...EncabezadoOp,
  materiales: z.array(EsquemaAltaMaterial).default([]),
  etapas: z.array(EsquemaAltaEtapa).optional(),
}).strict();

export const EsquemaActualizarOp = z.object(EncabezadoOp).strict();

export const EsquemaAltaCliente = z.object({ nombre: z.string().trim().min(1).max(150) }).strict();

export const EsquemaMaterialDetalle = z.object({
  id: z.string(),
  ordenId: z.string(),
  tipo: z.enum(TIPOS_MATERIAL),
  descripcion: z.string(),
  cantidad: z.string(),
  unidad: z.string().nullable(),
  costoUnitarioCotizado: z.string(),
  costoUnitarioReal: z.string().nullable(),
  nroRemito: z.string().nullable(),
  nroFactura: z.string().nullable(),
  nt: z.string().nullable(),
  po: z.string().nullable(),
});

export const EsquemaDetalleOp: z.ZodType<DetalleOpDTO> = EsquemaTarjetaOrdenBase.extend({
  etapas: z.array(EsquemaEtapaTarjetaBase.extend({ horasVendidas: z.string() })),
  fechaIngreso: z.string(),
  fechaEntrega: z.string(),
  montoVendido: z.string(),
  observaciones: z.string().nullable(),
  horas: z.array(z.never()),
  materiales: z.array(EsquemaMaterialDetalle),
  costoMaterialesCotizado: z.string(),
  costoMaterialesReal: z.string(),
});

export type CrearOp = z.infer<typeof EsquemaCrearOp>;
export type ActualizarOp = z.infer<typeof EsquemaActualizarOp>;
export type AltaEtapa = z.infer<typeof EsquemaAltaEtapa>;
export type AltaMaterial = z.infer<typeof EsquemaAltaMaterial>;
export type ReordenEtapa = z.infer<typeof EsquemaReordenEtapa>;
export type AltaCliente = z.infer<typeof EsquemaAltaCliente>;

export type CrearOpEntrada = z.input<typeof EsquemaCrearOp>;
export type ActualizarOpEntrada = z.input<typeof EsquemaActualizarOp>;
export type AltaEtapaEntrada = z.input<typeof EsquemaAltaEtapa>;
export type AltaMaterialEntrada = z.input<typeof EsquemaAltaMaterial>;
export type ReordenEtapaEntrada = z.input<typeof EsquemaReordenEtapa>;
export type AltaClienteEntrada = z.input<typeof EsquemaAltaCliente>;
