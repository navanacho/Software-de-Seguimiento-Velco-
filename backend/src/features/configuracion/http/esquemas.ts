import { z } from 'zod';

export const EsquemaConfiguracion = z.object({
  id: z.number().int(),
  valorHoraEstandar: z.string(),
  diasAlertaRiesgo: z.number().int(),
  porcentajeAvanceRiesgo: z.number().int(),
  etapasDefault: z.array(z.string()),
});
export const EsquemaConfiguracionJSON = z.toJSONSchema(EsquemaConfiguracion, { target: 'draft-07' });

export const BodyConfiguracionSchema = z.object({
  valorHoraEstandar: z.string(),
  diasAlertaRiesgo: z.number(),
  porcentajeAvanceRiesgo: z.number(),
  etapasDefault: z.array(z.string()),
}).strict();
export const BodyConfiguracionJSONSchema = z.toJSONSchema(BodyConfiguracionSchema, { target: 'draft-07' });

export const ErrorValidacionJSONSchema = z.toJSONSchema(z.object({
  error: z.literal('validation_error'),
  message: z.string(),
  details: z.array(z.object({ path: z.string(), message: z.string() })),
}), { target: 'draft-07' });
