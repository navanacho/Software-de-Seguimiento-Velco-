export type CodigoPlano = string | null;

export function normalizarCodigoPlano(valor: string | null | undefined): CodigoPlano {
  if (valor === null || valor === undefined) return null;
  const normalizado = valor.trim().toUpperCase();
  return normalizado === '' ? null : normalizado;
}
