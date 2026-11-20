import type { Prisma } from '@prisma/client';
import { z } from 'zod';

const esquemaEtapas = z.tuple([
  z.literal('Corte'),
  z.literal('Soldadura'),
  z.literal('Mecanizado'),
  z.literal('Pintura'),
  z.literal('Entrega'),
]);

export function convertirEtapasDefault(valor: Prisma.JsonValue): readonly string[] {
  const resultado = esquemaEtapas.safeParse(valor);
  if (!resultado.success) {
    throw new Error('etapas_default debe contener la lista canónica de cinco etapas');
  }
  return resultado.data;
}
