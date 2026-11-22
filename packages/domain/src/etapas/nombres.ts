export function nombreEtapaDuplicado(nombresExistentes: readonly string[], nombreNuevo: string): boolean {
  const normalizar = (valor: string): string => valor.trim().toLocaleLowerCase('es-AR');
  const nuevo = normalizar(nombreNuevo);
  return nombresExistentes.some((nombre) => normalizar(nombre) === nuevo);
}
