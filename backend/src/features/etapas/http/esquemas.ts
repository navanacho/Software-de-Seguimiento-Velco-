import { z } from 'zod';

export const ParamsEtapaSchema = z.object({
  id: z.string().uuid(),
  etapaId: z.string().uuid(),
});

export const BodyPatchEtapaSchema = z.object({ completada: z.boolean() }).strict();

export type ParamsEtapa = z.infer<typeof ParamsEtapaSchema>;
export type BodyPatchEtapa = z.infer<typeof BodyPatchEtapaSchema>;

export const ParamsEtapaJSONSchema = z.toJSONSchema(ParamsEtapaSchema, { target: 'draft-07' });
export const BodyPatchEtapaJSONSchema = z.toJSONSchema(BodyPatchEtapaSchema, {
  target: 'draft-07',
});
