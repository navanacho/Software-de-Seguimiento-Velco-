import { z } from 'zod';

export const EsquemaConfiguracion = z.object({
  id: z.number().int(),
  valorHoraEstandar: z.string(),
  diasAlertaRiesgo: z.number().int(),
  porcentajeAvanceRiesgo: z.number().int(),
  etapasDefault: z.array(z.string()),
});
export type ConfiguracionDTO = z.infer<typeof EsquemaConfiguracion>;

export const EsquemaBodyConfiguracion = z.object({
  valorHoraEstandar: z.string(),
  diasAlertaRiesgo: z.number(),
  porcentajeAvanceRiesgo: z.number(),
  etapasDefault: z.array(z.string()),
}).strict();
export type BodyConfiguracion = z.infer<typeof EsquemaBodyConfiguracion>;
