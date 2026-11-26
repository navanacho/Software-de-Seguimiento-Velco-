export interface ErrorPlantillaNoEncontrada {
  code: 'plantilla_no_encontrada';
  nombrePlantilla: string;
  message: string;
}

export function esErrorPlantillaNoEncontrada(valor: unknown): valor is ErrorPlantillaNoEncontrada {
  if (typeof valor !== 'object' || valor === null) {
    return false;
  }
  const candidato = valor as {
    code?: unknown;
    nombrePlantilla?: unknown;
    message?: unknown;
  };
  return (
    candidato.code === 'plantilla_no_encontrada' &&
    typeof candidato.nombrePlantilla === 'string' &&
    typeof candidato.message === 'string'
  );
}
