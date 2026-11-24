import { validarEtapasDefault } from '@velco/domain';
import type { Prisma } from '@prisma/client';

export function convertirEtapasDefault(valor: Prisma.JsonValue): readonly string[] {
  const resultado = validarEtapasDefault(valor);
  if (!resultado.valido) {
    throw new Error('etapas_default debe ser una lista válida de nombres de etapas');
  }
  return resultado.nombres;
}
