import { z } from 'zod';

export const ParamsEtapaSchema = z.object({
  id: z.string().uuid(),
  etapaId: z.string().uuid(),
});

export const BodyPatchEtapaSchema = z.object({ completada: z.boolean() }).strict();

export type ParamsEtapa = z.infer<typeof ParamsEtapaSchema>;

export const BodyAltaEtapaSchema = z.object({
  nombre: z.string().trim().min(1).max(100),
  horasVendidas: z.string().optional(),
}).strict();
export const BodyAltaEtapaJSONSchema = z.toJSONSchema(BodyAltaEtapaSchema, { target: 'draft-07' });
export const BodyReordenEtapaSchema = z.object({ ordenSecuencia: z.number().int().min(1) }).strict();
export const BodyReordenEtapaJSONSchema = z.toJSONSchema(BodyReordenEtapaSchema, { target: 'draft-07' });
export type BodyPatchEtapa = z.infer<typeof BodyPatchEtapaSchema>;

export const ParamsEtapaJSONSchema = z.toJSONSchema(ParamsEtapaSchema, { target: 'draft-07' });
export const BodyPatchEtapaJSONSchema = z.toJSONSchema(BodyPatchEtapaSchema, {
  target: 'draft-07',
});
