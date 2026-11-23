import { z } from 'zod';

function esFechaCalendario(valor: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const fecha = new Date(`${valor}T00:00:00.000Z`);
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor;
}

const EsquemaFecha = z.string().refine(esFechaCalendario, 'fecha calendario inválida');
const EsquemaHoras = z.string().regex(/^\d+(\.\d{1,2})?$/).refine((v) => Number(v) > 0, 'horas debe ser > 0');

export const ParamsOpHoraSchema = z.object({ id: z.string().uuid(), parteId: z.string().uuid() });
export const ParamsOpHoraJSONSchema = z.toJSONSchema(ParamsOpHoraSchema, { target: 'draft-07' });

export const BodyCrearHoraSchema = z.object({
  etapaId: z.string().uuid().nullable().optional(),
  operario: z.string().trim().min(1).max(100),
  fecha: EsquemaFecha,
  horas: EsquemaHoras,
  observacion: z.string().optional().nullable(),
}).strict();
export const BodyCrearHoraJSONSchema = z.toJSONSchema(BodyCrearHoraSchema, { target: 'draft-07' });

export const BodyEditarHoraSchema = z.object({
  etapaId: z.string().uuid().nullable().optional(),
  operario: z.string().trim().min(1).max(100).optional(),
  fecha: EsquemaFecha.optional(),
  horas: EsquemaHoras.optional(),
  observacion: z.string().optional().nullable(),
}).strict().refine((v) => Object.keys(v).length > 0, 'cuerpo vacío');
export const BodyEditarHoraJSONSchema = z.toJSONSchema(BodyEditarHoraSchema, { target: 'draft-07' });

export const ParteHoraSchema = z.object({
  id: z.string().uuid(),
  ordenId: z.string().uuid(),
  etapaId: z.string().uuid().nullable(),
  operario: z.string(),
  fecha: z.string(),
  horas: z.string(),
  createdAt: z.string(),
  observacion: z.string().nullable(),
});
export const ParteHoraJSONSchema = z.toJSONSchema(ParteHoraSchema, { target: 'draft-07' });
export const RespuestaListarHorasJSONSchema = z.toJSONSchema(z.array(ParteHoraSchema), { target: 'draft-07' });
export const RespuestaEliminarHoraJSONSchema = z.toJSONSchema(z.object({ ok: z.literal(true) }), { target: 'draft-07' });
