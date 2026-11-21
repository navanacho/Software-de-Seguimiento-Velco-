export interface ConfiguracionServidor {
  puerto: number;
  origenCors: string;
  baseUncExcel: string;
  zonaHoraria?: string;
}

export const ZONA_HORARIA_POR_DEFECTO = 'America/Argentina/Mendoza';

type Entorno = Readonly<Record<string, string | undefined>>;

export function leerConfiguracion(entorno: Entorno = process.env): ConfiguracionServidor {
  const puerto = Number(entorno.PORT ?? '3001');
  if (!Number.isInteger(puerto) || puerto < 0 || puerto > 65535) {
    throw new Error('PORT debe ser un entero entre 0 y 65535');
  }

  return {
    puerto,
    origenCors: entorno.CORS_ORIGIN ?? '',
    baseUncExcel: entorno.EXCEL_UNC_BASE ?? '',
    zonaHoraria: entorno.TZ ?? ZONA_HORARIA_POR_DEFECTO,
  };
}
