import { spawnSync } from 'node:child_process';
import { cargarPlantillaConPuerto, type PuertoConfiguracionExcel } from './configuracion';
import { esErrorPlantillaNoEncontrada } from './errores';
import { compararConDiffControlado } from './gate';
import { descriptorPlantilla, type IdPlantilla } from './inventario';
import { parchearPlantilla, type ValoresCelda } from './patcher';
import { traducirErrorPlantilla } from './respuesta';

export interface ResultadoValidacionOpenSpec {
  comando: string;
  codigo: number;
  salida: string;
}

export interface RespuestaExportacionError {
  tipo: 'error';
  estado: 500;
  cuerpo: {
    error: 'plantilla_no_encontrada' | 'gate_no_conforme';
    message: string;
    motivos?: readonly string[];
  };
  cabeceras: Readonly<Record<string, string>>;
}

export interface RespuestaExportacionCorrecta {
  tipo: 'ok';
  estado: 200;
  cuerpo: Buffer;
  cabeceras: Readonly<Record<string, string>>;
}

export type RespuestaExportacion = RespuestaExportacionError | RespuestaExportacionCorrecta;

export function ejecutarValidacionOpenSpec(
  argumentos: readonly string[],
  directorio: string,
): ResultadoValidacionOpenSpec {
  const comando = `openspec ${argumentos.join(' ')}`;
  const ejecucion = spawnSync('cmd.exe', ['/d', '/c', comando], {
    cwd: directorio,
    encoding: 'utf8',
    windowsHide: true,
    maxBuffer: 10 * 1024 * 1024,
  });

  return {
    comando,
    codigo: ejecucion.status ?? 1,
    salida: `${ejecucion.stdout ?? ''}${ejecucion.stderr ?? ''}`,
  };
}

export function exportarConGate(
  puerto: PuertoConfiguracionExcel,
  id: IdPlantilla,
  valores: ValoresCelda,
  plano?: string | null,
): RespuestaExportacion {
  const descriptor = descriptorPlantilla(id);
  let original: Buffer;
  try {
    original = cargarPlantillaConPuerto(puerto, descriptor.archivo);
  } catch (error) {
    if (esErrorPlantillaNoEncontrada(error)) {
      return { tipo: 'error', ...traducirErrorPlantilla(error) };
    }
    throw error;
  }

  const salida = parchearPlantilla(id, original, valores, plano);
  const informe = compararConDiffControlado(id, original, salida);
  if (!informe.conforme) {
    const detalles = [
      ...informe.motivos,
      ...informe.piezasNoAutorizadas.map((pieza) => `pieza:${pieza}`),
      ...informe.diferenciasNoAutorizadas.map((diferencia) => `${diferencia.hoja}!${diferencia.celda}`),
    ];
    return {
      tipo: 'error',
      estado: 500,
      cuerpo: {
        error: 'gate_no_conforme',
        message: `El gate controlado rechazó ${descriptor.archivo}: ${detalles.join('; ') || 'sin detalle'}`,
        motivos: detalles,
      },
      cabeceras: { 'content-type': 'application/json; charset=utf-8' },
    };
  }

  return {
    tipo: 'ok',
    estado: 200,
    cuerpo: salida,
    cabeceras: {
      'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'content-disposition': `attachment; filename="${descriptor.archivo}"`,
    },
  };
}
