import { z } from 'zod';

const ESTADOS = ['Terminado', 'Atrasado', 'En riesgo', 'En plazo'] as const;

function esFechaCalendario(valor: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const fecha = new Date(`${valor}T00:00:00.000Z`);
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor;
}

const EsquemaFecha = z.string().refine(esFechaCalendario, 'fecha calendaria inválida');

const ConsultaListadoOpsBase = z
  .object({
    fechaDesde: EsquemaFecha.optional(),
    fechaHasta: EsquemaFecha.optional(),
    estado: z.enum(ESTADOS).optional(),
    clienteId: z.string().uuid().optional(),
    etapaAhora: z.string().trim().min(1).max(100).optional(),
    buscar: z.string().trim().min(1).max(100).optional(),
    conPlano: z.enum(['true', 'false']).optional(),
    estadoPlano: z.never().optional(),
  })
  .strict();

const ConsultaListadoOpsRefinado = ConsultaListadoOpsBase.refine(
  (consulta) => {
    if (consulta.fechaDesde === undefined || consulta.fechaHasta === undefined) return true;
    return consulta.fechaDesde <= consulta.fechaHasta;
  },
  { message: 'fechaDesde no puede ser posterior a fechaHasta', path: ['fechaHasta'] },
);

export const ConsultaListadoOpsSchema = ConsultaListadoOpsRefinado.transform((consulta) => {
  const { conPlano, ...resto } = consulta;
  return {
    ...resto,
    ...(conPlano !== undefined ? { conPlano: conPlano === 'true' } : {}),
  };
});

export type ConsultaListadoOps = z.output<typeof ConsultaListadoOpsSchema>;

export const ConsultaListadoOpsJSONSchema = z.toJSONSchema(ConsultaListadoOpsBase, {
  target: 'draft-07',
});

export const ParamsOpSchema = z.object({ id: z.string().uuid() });
export type ParamsOp = z.infer<typeof ParamsOpSchema>;
export const ParamsOpJSONSchema = z.toJSONSchema(ParamsOpSchema, { target: 'draft-07' });

const EtapaTarjetaSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  ordenSecuencia: z.number().int(),
  completada: z.boolean(),
});

const TarjetaOrdenSchema = z.object({
  id: z.string(),
  numeroOp: z.string(),
  codigoPlano: z.string().max(80).nullable(),
  clienteId: z.string(),
  clienteNombre: z.string().nullable(),
  descripcionPieza: z.string(),
  etapas: z.array(EtapaTarjetaSchema),
  avance: z.number(),
  semaforo: z.enum(ESTADOS),
  diasRestantes: z.number(),
  etapaAhora: z.string(),
  etiquetaPlazo: z.string(),
});

const RespuestaListadoOpsSchema = z.object({
  ops: z.array(TarjetaOrdenSchema),
  kpis: z.object({
    total: z.number().int(),
    porEstado: z.object({
      Terminado: z.number().int(),
      Atrasado: z.number().int(),
      'En riesgo': z.number().int(),
      'En plazo': z.number().int(),
    }),
  }),
  flujo: z.array(z.object({ etapa: z.string(), cantidad: z.number().int() })),
});

export const TarjetaOrdenJSONSchema = z.toJSONSchema(TarjetaOrdenSchema, { target: 'draft-07' });

export const RespuestaListadoOpsJSONSchema = z.toJSONSchema(RespuestaListadoOpsSchema, {
  target: 'draft-07',
});

const ObservacionHoras = 'Pendiente de C-08; arreglo vacío tipado sin datos inventados.';

const MaterialDetalleSchema = z.object({
  id: z.string(),
  ordenId: z.string(),
  tipo: z.enum(['MP', 'INSUMOS', 'TERCERIZADOS']),
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

const DetalleOpSchema = TarjetaOrdenSchema.extend({
  etapas: z.array(EtapaTarjetaSchema.extend({ horasVendidas: z.string() })),
  fechaIngreso: z.string(),
  fechaEntrega: z.string(),
  montoVendido: z.string(),
  observaciones: z.string().nullable(),
  horas: z.array(z.never()).describe(ObservacionHoras),
  materiales: z.array(MaterialDetalleSchema),
  costoMaterialesCotizado: z.string(),
  costoMaterialesReal: z.string(),
});

export const DetalleOpJSONSchema = z.toJSONSchema(DetalleOpSchema, { target: 'draft-07' });

const EsquemaCodigoPlano = z.string().trim().max(80).optional().nullable().describe('Opcional — Ej: PL-2026-045');
const MaterialInputSchema = z.object({
  tipo: z.enum(['MP', 'INSUMOS', 'TERCERIZADOS']),
  descripcion: z.string().trim().min(1),
  cantidad: z.string().regex(/^\d+(\.\d+)?$/).refine((v) => Number(v) > 0),
  unidad: z.string().trim().max(20).optional().nullable(),
  costoUnitarioCotizado: z.string().regex(/^\d+(\.\d+)?$/).refine((v) => Number(v) >= 0),
  costoUnitarioReal: z.string().regex(/^\d+(\.\d+)?$/).refine((v) => Number(v) >= 0).optional().nullable(),
  nroRemito: z.string().trim().max(50).optional().nullable(),
  nroFactura: z.string().trim().max(50).optional().nullable(),
  nt: z.string().trim().max(50).optional().nullable(),
  po: z.string().trim().max(50).optional().nullable(),
}).strict();

const EtapaInputSchema = z.object({ nombre: z.string().trim().min(1).max(100), horasVendidas: z.string().optional() }).strict();

export const BodyCreateOpSchema = z.object({
  numeroOp: z.string().trim().min(1).max(50),
  codigoPlano: EsquemaCodigoPlano,
  clienteNombre: z.string().trim().min(1).max(150),
  descripcionPieza: z.string().trim().min(1),
  fechaEntrega: EsquemaFecha,
  montoVendido: z.string().regex(/^\d+(\.\d+)?$/),
  observaciones: z.string().optional().nullable(),
  materiales: z.array(MaterialInputSchema).default([]),
  etapas: z.array(EtapaInputSchema).optional(),
}).strict();
export const BodyUpdateOpSchema = z.object({
  numeroOp: z.string().trim().min(1).max(50),
  codigoPlano: EsquemaCodigoPlano,
  clienteNombre: z.string().trim().min(1).max(150),
  descripcionPieza: z.string().trim().min(1),
  fechaEntrega: EsquemaFecha,
  montoVendido: z.string().regex(/^\d+(\.\d+)?$/),
  observaciones: z.string().optional().nullable(),
}).strict();

export const BodyCreateOpJSONSchema = z.toJSONSchema(BodyCreateOpSchema, { target: 'draft-07' });
export const BodyUpdateOpJSONSchema = z.toJSONSchema(BodyUpdateOpSchema, { target: 'draft-07' });

export const ConflictoPlanoJSONSchema = z.toJSONSchema(z.object({
  error: z.literal('codigo_plano_duplicado'),
  message: z.string(),
  codigoPlano: z.string(),
  opExistente: z.object({ id: z.string(), numeroOp: z.string() }),
}), { target: 'draft-07' });
export const ConflictoNumeroOpJSONSchema = z.toJSONSchema(z.object({
  error: z.literal('numero_op_duplicado'),
  message: z.string(),
  numeroOp: z.string(),
}), { target: 'draft-07' });
