import { ErrorApi } from '../../shared/domain-client/errores.ts';
import type { ErroresFormulario } from './tiposFormulario.ts';

export function mapearErrorGuardado(error: unknown): ErroresFormulario {
  if (!(error instanceof ErrorApi)) {
    return { campos: {}, mensaje: 'No se pudo guardar la orden.' };
  }
  const causa = error.causa;
  if (causa.tipo === 'codigo_plano_duplicado') {
    return {
      campos: { codigoPlano: causa.message },
      mensaje: causa.message,
      opExistente: causa.opExistente,
    };
  }
  if (causa.tipo === 'numero_op_duplicado') {
    return { campos: { numeroOp: causa.message }, mensaje: causa.message };
  }
  if (causa.tipo === 'validation_error') {
    const campos: Record<string, string> = {};
    for (const detalle of causa.detalles) {
      if (campos[detalle.path] === undefined) campos[detalle.path] = detalle.message;
    }
    return { campos, mensaje: causa.message };
  }
  return { campos: {}, mensaje: causa.message };
}
