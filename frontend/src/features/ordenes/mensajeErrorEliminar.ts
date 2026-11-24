export function mensajeErrorEliminar(error: unknown): string {
  const motivo = error instanceof Error && error.message.trim() !== ''
    ? error.message
    : 'error desconocido';
  return `No se pudo eliminar la parte de horas: ${motivo}. Revisá la conexión y reintentá la eliminación.`;
}
