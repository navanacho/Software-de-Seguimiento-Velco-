import { z } from 'zod';
import { ParamsOpJSONSchema, ParamsOpSchema } from '../../ordenes/http/esquemas.ts';

export { ParamsOpJSONSchema, ParamsOpSchema };
export type ParamsOp = z.infer<typeof ParamsOpSchema>;

export const ConsultaExportacionSchema = z.object({ variante: z.literal('costeo') }).strict();
export type ConsultaExportacion = z.infer<typeof ConsultaExportacionSchema>;
export const ConsultaExportacionJSONSchema = z.toJSONSchema(ConsultaExportacionSchema, {
  target: 'draft-07',
});

const RespuestaErrorPlantilla = z.object({
  error: z.literal('plantilla_no_encontrada'),
  message: z.string(),
});
const RespuestaErrorValidacion = z.object({
  error: z.literal('validation_error'),
  message: z.string(),
  details: z.array(z.object({ path: z.string(), message: z.string() })),
});
const RespuestaNoEncontrado = z.object({
  error: z.literal('not_found'),
  message: z.string(),
});

export const RespuestaErrorPlantillaJSONSchema = z.toJSONSchema(RespuestaErrorPlantilla, {
  target: 'draft-07',
});
export const RespuestaErrorValidacionJSONSchema = z.toJSONSchema(RespuestaErrorValidacion, {
  target: 'draft-07',
});
export const RespuestaNoEncontradoJSONSchema = z.toJSONSchema(RespuestaNoEncontrado, {
  target: 'draft-07',
});
