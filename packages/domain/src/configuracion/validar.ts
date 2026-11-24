import { nombreEtapaDuplicado } from '../etapas/nombres.ts';

export interface ErrorValidacionConfiguracion {
  readonly campo: string;
  readonly mensaje: string;
}

export type ResultadoValidacionEtapas =
  | { readonly valido: true; readonly nombres: readonly string[] }
  | { readonly valido: false; readonly errores: readonly ErrorValidacionConfiguracion[] };

export interface ConfiguracionValidada {
  readonly valorHoraEstandar: string;
  readonly diasAlertaRiesgo: number;
  readonly porcentajeAvanceRiesgo: number;
  readonly etapasDefault: readonly string[];
}

export type ResultadoValidacionConfiguracion =
  | { readonly valido: true; readonly valores: ConfiguracionValidada }
  | { readonly valido: false; readonly errores: readonly ErrorValidacionConfiguracion[] };

const DECIMAL_VALIDO = /^\d+(\.\d{1,2})?$/;
const LONGITUD_MAXIMA_ETAPA = 100;

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null;
}

function esListaDeCadenas(valor: unknown): valor is readonly string[] {
  return Array.isArray(valor) && valor.every((item): item is string => typeof item === 'string');
}

function normalizarDecimal(valor: string): string {
  const [enteras, decimales = ''] = valor.split('.');
  return `${enteras}.${decimales.padEnd(2, '0')}`;
}

export function validarEtapasDefault(valor: unknown): ResultadoValidacionEtapas {
  if (!esListaDeCadenas(valor) || valor.length === 0) {
    return { valido: false, errores: [{ campo: 'etapasDefault', mensaje: 'Debe contener al menos un nombre' }] };
  }
  const errores: ErrorValidacionConfiguracion[] = [];
  const nombres: string[] = [];
  valor.forEach((etapa, indice) => {
    const nombre = etapa.trim();
    const campo = `etapasDefault.${indice}`;
    if (nombre === '') {
      errores.push({ campo, mensaje: 'El nombre de la etapa no puede estar vacío' });
    } else if (nombre.length > LONGITUD_MAXIMA_ETAPA) {
      errores.push({ campo, mensaje: `El nombre no puede superar ${LONGITUD_MAXIMA_ETAPA} caracteres` });
    } else if (nombreEtapaDuplicado(nombres, nombre)) {
      errores.push({ campo, mensaje: 'El nombre de la etapa está duplicado' });
    } else {
      nombres.push(nombre);
    }
  });
  return errores.length > 0 ? { valido: false, errores } : { valido: true, nombres };
}

export function validarConfiguracion(entrada: unknown): ResultadoValidacionConfiguracion {
  const errores: ErrorValidacionConfiguracion[] = [];
  const datos = esObjeto(entrada) ? entrada : {};
  const valorHora = datos.valorHoraEstandar;
  const dias = datos.diasAlertaRiesgo;
  const porcentaje = datos.porcentajeAvanceRiesgo;
  const resultadoEtapas = validarEtapasDefault(datos.etapasDefault);

  if (typeof valorHora !== 'string' || !DECIMAL_VALIDO.test(valorHora)) {
    errores.push({ campo: 'valorHoraEstandar', mensaje: 'Debe ser un decimal de hasta dos decimales' });
  }
  if (typeof dias !== 'number' || !Number.isInteger(dias) || dias < 0) {
    errores.push({ campo: 'diasAlertaRiesgo', mensaje: 'Debe ser un entero mayor o igual a cero' });
  }
  if (typeof porcentaje !== 'number' || !Number.isInteger(porcentaje) || porcentaje < 0 || porcentaje > 100) {
    errores.push({ campo: 'porcentajeAvanceRiesgo', mensaje: 'Debe ser un entero entre 0 y 100' });
  }
  if (!resultadoEtapas.valido) errores.push(...resultadoEtapas.errores);

  if (errores.length > 0) return { valido: false, errores };
  const nombresEtapas = resultadoEtapas.valido ? resultadoEtapas.nombres : [];

  return {
    valido: true,
    valores: {
      valorHoraEstandar: normalizarDecimal(valorHora as string),
      diasAlertaRiesgo: dias as number,
      porcentajeAvanceRiesgo: porcentaje as number,
      etapasDefault: nombresEtapas,
    },
  };
}
