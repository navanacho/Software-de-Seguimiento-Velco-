import { z } from 'zod';
import { TIPOS_MATERIAL } from '@velco/domain';

const decimalPositivo = z.string().regex(/^\d+(\.\d+)?$/).refine((v) => Number(v) > 0);
const decimalNoNegativo = z.string().regex(/^\d+(\.\d+)?$/).refine((v) => Number(v) >= 0);
const opcional50 = z.string().trim().max(50).optional().nullable();
const opcional20 = z.string().trim().max(20).optional().nullable();

export const BodyAltaMaterialSchema = z.object({
  tipo: z.enum(TIPOS_MATERIAL),
  descripcion: z.string().trim().min(1),
  cantidad: decimalPositivo,
  unidad: opcional20,
  costoUnitarioCotizado: decimalNoNegativo,
  costoUnitarioReal: decimalNoNegativo.optional().nullable(),
  nroRemito: opcional50,
  nroFactura: opcional50,
  nt: opcional50,
  po: opcional50,
}).strict();

export type BodyAltaMaterial = z.infer<typeof BodyAltaMaterialSchema>;
export const BodyAltaMaterialJSONSchema = z.toJSONSchema(BodyAltaMaterialSchema, { target: 'draft-07' });
