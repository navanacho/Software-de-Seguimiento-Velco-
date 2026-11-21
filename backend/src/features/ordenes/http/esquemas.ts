import { z } from 'zod';

const ESTADOS = ['Terminado', 'Atrasado', 'En riesgo', 'En plazo'] as const;

function esFechaCalendario(valor: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const fecha = new Date(`${valor}T00:00:00.000Z`);
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor;
}

const EsquemaFecha = z.string().refine(esFechaCalendario, 'fecha calendaria inválida');

const ConsultaListadoOpsBase = z.object({
  fechaDesde: EsquemaFecha.optional(),
  fechaHasta: EsquemaFecha.optional(),
  estado: z.enum(ESTADOS).optional(),
  clienteId: z.string().uuid().optional(),
  etapaAhora: z.string().trim().min(1).max(100).optional(),
  buscar: z.string().trim().min(1).max(100).optional(),
});

export const ConsultaListadoOpsSchema = ConsultaListadoOpsBase.refine(
  (consulta) => {
    if (consulta.fechaDesde === undefined || consulta.fechaHasta === undefined) return true;
    return consulta.fechaDesde <= consulta.fechaHasta;
  },
  { message: 'fechaDesde no puede ser posterior a fechaHasta', path: ['fechaHasta'] },
);

export type ConsultaListadoOps = z.infer<typeof ConsultaListadoOpsSchema>;

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

const ObservacionOQ3 = 'Pendiente de C-08/C-06 (OQ-3); no significa que la OP no tenga datos.';

const DetalleOpSchema = TarjetaOrdenSchema.extend({
  etapas: z.array(EtapaTarjetaSchema.extend({ horasVendidas: z.string() })),
  fechaIngreso: z.string(),
  fechaEntrega: z.string(),
  montoVendido: z.string(),
  observaciones: z.string().nullable(),
  horas: z.array(z.never()).describe(ObservacionOQ3),
  materiales: z.array(z.never()).describe(ObservacionOQ3),
});

export const DetalleOpJSONSchema = z.toJSONSchema(DetalleOpSchema, { target: 'draft-07' });
