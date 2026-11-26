import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { type ErrorPlantillaNoEncontrada } from './errores';

export { esErrorPlantillaNoEncontrada, type ErrorPlantillaNoEncontrada } from './errores';

export function cargarPlantilla(directorio: string, nombre: string): Buffer {
  const ruta = join(directorio, nombre);
  if (!existsSync(ruta)) {
    const error: ErrorPlantillaNoEncontrada = {
      code: 'plantilla_no_encontrada',
      nombrePlantilla: nombre,
      message: `No se encontró la plantilla oficial ${nombre}. Verifique EXCEL_TEMPLATES_DIR.`,
    };
    throw error;
  }
  return readFileSync(ruta);
}
