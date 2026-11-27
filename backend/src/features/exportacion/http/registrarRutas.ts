import type { FastifyInstance } from 'fastify';
import { RecursoNoEncontradoError } from '../../../shared/errores.ts';
import type { DependenciasApi } from '../../../shared/dependencias.ts';
import { preValidar, validar } from '../../../shared/validacion.ts';
import { exportOp } from '../application/exportOp.ts';
import { generarCosteo } from '../excel/costeo.ts';
import { puertoConfiguracionExcel, type PuertoConfiguracionExcel } from '../excel/configuracion.ts';
import {
  esErrorPlantillaNoEncontrada,
  type ErrorPlantillaNoEncontrada,
} from '../excel/errores.ts';
import { cargarPlantillaParaExportacion } from '../excel/exportacion.ts';
import { mapearModeloACeldas } from '../excel/mapeo.ts';
import { traducirErrorPlantilla } from '../excel/respuesta.ts';
import { nombreArchivoCosteo } from './nombreDescarga.ts';
import {
  ConsultaExportacionJSONSchema,
  ConsultaExportacionSchema,
  ParamsOpJSONSchema,
  ParamsOpSchema,
  RespuestaErrorPlantillaJSONSchema,
  RespuestaErrorValidacionJSONSchema,
  RespuestaNoEncontradoJSONSchema,
} from './esquemas.ts';

const NOMBRE_PLANTILLA = 'MASTER COSTEO NUEVO.xlsx';
const TIPO_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const CABECERA_CONTENIDO = 'content-type';
const CABECERA_DESCARGA = 'content-disposition';
const MENSAJE_CONFIGURACION_AUSENTE = 'EXCEL_TEMPLATES_DIR no está configurado';

function traducirErrorDeConfiguracion(error: unknown): unknown {
  if (error instanceof Error && error.message === MENSAJE_CONFIGURACION_AUSENTE) {
    const traducido: ErrorPlantillaNoEncontrada = {
      code: 'plantilla_no_encontrada',
      nombrePlantilla: NOMBRE_PLANTILLA,
      message: `No se encontró la plantilla oficial ${NOMBRE_PLANTILLA} en el directorio configurado.`,
    };
    return traducido;
  }
  return error;
}

export function registrarRutasExportacion(
  app: FastifyInstance,
  dependencias: DependenciasApi,
  crearPuerto: () => PuertoConfiguracionExcel = () => puertoConfiguracionExcel(),
): void {
  app.get(
    '/api/ops/:id/export',
    {
      schema: {
        description: 'Descarga el costeo de una orden de trabajo desde la plantilla oficial',
        tags: ['exportacion'],
        params: ParamsOpJSONSchema,
        querystring: ConsultaExportacionJSONSchema,
        response: {
          200: { type: 'string', format: 'binary' },
          404: RespuestaNoEncontradoJSONSchema,
          422: RespuestaErrorValidacionJSONSchema,
          500: RespuestaErrorPlantillaJSONSchema,
        },
      },
      preValidation: [
        preValidar(ParamsOpSchema, (request) => request.params),
        preValidar(ConsultaExportacionSchema, (request) => request.query),
      ],
    },
    async (request, reply) => {
      const { id } = validar(ParamsOpSchema, request.params);
      validar(ConsultaExportacionSchema, request.query);
      const modelo = await exportOp(dependencias, id, { incluirMargenes: true });
      if (modelo === null) throw new RecursoNoEncontradoError(`OP ${id} inexistente`);

      let original: Buffer;
      try {
        const puerto = crearPuerto();
        original = cargarPlantillaParaExportacion(puerto, NOMBRE_PLANTILLA);
      } catch (error: unknown) {
        const errorTraducido = traducirErrorDeConfiguracion(error);
        if (esErrorPlantillaNoEncontrada(errorTraducido)) {
          const respuesta = traducirErrorPlantilla(errorTraducido);
          return reply
            .code(respuesta.estado)
            .headers(respuesta.cabeceras)
            .send(respuesta.cuerpo);
        }
        throw errorTraducido;
      }
      const salida = generarCosteo(original, mapearModeloACeldas(modelo));
      return reply
        .header(CABECERA_CONTENIDO, TIPO_XLSX)
        .header(
          CABECERA_DESCARGA,
          `attachment; filename="${nombreArchivoCosteo(modelo.numeroOp, modelo.cliente)}"`,
        )
        .send(salida);
    },
  );
}
