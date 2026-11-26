import { cargarPlantillaConPuerto, type PuertoConfiguracionExcel } from './configuracion';

export function cargarPlantillaParaExportacion(
  puerto: PuertoConfiguracionExcel,
  nombre: string,
): Buffer {
  return cargarPlantillaConPuerto(puerto, nombre);
}
