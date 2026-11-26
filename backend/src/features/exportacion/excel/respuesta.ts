import { esErrorPlantillaNoEncontrada } from './errores';

export interface RespuestaErrorPlantilla {
  estado: 500;
  cuerpo: {
    error: 'plantilla_no_encontrada';
    message: string;
  };
  cabeceras: Readonly<Record<string, string>>;
}

export function traducirErrorPlantilla(error: unknown): RespuestaErrorPlantilla {
  if (!esErrorPlantillaNoEncontrada(error)) {
    throw new Error('el error no corresponde a una plantilla ausente');
  }
  return {
    estado: 500,
    cuerpo: { error: error.code, message: error.message },
    cabeceras: { 'content-type': 'application/json; charset=utf-8' },
  };
}
