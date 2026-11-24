import { validarConfiguracion } from '@velco/domain';
import type { Configuracion, ErrorValidacionConfiguracion } from '@velco/domain';
import type { ConfiguracionRepository } from './ports/ConfiguracionRepository.ts';

export type ResultadoActualizarConfiguracion =
  | { readonly valido: true; readonly configuracion: Configuracion }
  | { readonly valido: false; readonly errores: readonly ErrorValidacionConfiguracion[] };

export async function actualizarConfiguracion(
  repositorio: ConfiguracionRepository,
  entrada: unknown,
): Promise<ResultadoActualizarConfiguracion> {
  const validacion = validarConfiguracion(entrada);
  if (!validacion.valido) return validacion;
  const configuracion: Configuracion = { id: 1, ...validacion.valores };
  return { valido: true, configuracion: await repositorio.actualizar(configuracion) };
}
