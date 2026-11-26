import { cargarPlantilla } from './carga';

type Entorno = Readonly<Record<string, string | undefined>>;

export interface PuertoConfiguracionExcel {
  directorioPlantillas(): string;
  referenciaHistoricaUnc(): string | undefined;
}

export function puertoConfiguracionExcel(entorno: Entorno = process.env): PuertoConfiguracionExcel {
  const directorio = entorno.EXCEL_TEMPLATES_DIR;
  if (directorio === undefined) {
    throw new Error('EXCEL_TEMPLATES_DIR no está configurado');
  }
  return {
    directorioPlantillas: () => directorio,
    referenciaHistoricaUnc: () => entorno.EXCEL_UNC_BASE,
  };
}

export function cargarPlantillaConPuerto(
  puerto: PuertoConfiguracionExcel,
  nombre: string,
): Buffer {
  return cargarPlantilla(puerto.directorioPlantillas(), nombre);
}

export function cargarPlantillaConConfiguracion(entorno: Entorno, nombre: string): Buffer {
  return cargarPlantillaConPuerto(puertoConfiguracionExcel(entorno), nombre);
}
