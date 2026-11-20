import type { OrdenTrabajo } from '../ordenes/contrato.ts';
import type { ContextoPlazo, EstadoSemaforo } from './contrato.ts';
import { fechaCalendario } from './fecha-calendario.ts';

function partesFecha(fecha: string): readonly [number, number, number] | null {
  const [anio, mes, dia] = fecha.split('-');
  if (anio === undefined || mes === undefined || dia === undefined) {
    return null;
  }
  const anioNumero = Number(anio);
  const mesNumero = Number(mes);
  const diaNumero = Number(dia);
  if (
    !Number.isInteger(anioNumero) ||
    !Number.isInteger(mesNumero) ||
    !Number.isInteger(diaNumero)
  ) {
    return null;
  }
  return [anioNumero, mesNumero, diaNumero];
}

function ordinalCalendario(anio: number, mes: number, dia: number): number {
  const anioAjustado = anio - (mes <= 2 ? 1 : 0);
  const era = Math.floor(anioAjustado / 400);
  const anioDeEra = anioAjustado - era * 400;
  const diaDeAnio =
    Math.floor((153 * (mes + (mes > 2 ? -3 : 9)) + 2) / 5) + dia - 1;
  const diaDeEra =
    anioDeEra * 365 +
    Math.floor(anioDeEra / 4) -
    Math.floor(anioDeEra / 100) +
    diaDeAnio;
  return era * 146097 + diaDeEra - 719468;
}

function pluralizar(cantidad: number): string {
  return cantidad === 1 ? 'día' : 'días';
}

export function etiquetaPlazo(dias: number, semaforo: EstadoSemaforo): string {
  if (semaforo === 'Terminado') {
    return 'Terminado';
  }
  if (dias === 0) {
    return 'Vence hoy';
  }
  if (dias > 0) {
    return `Faltan ${dias} ${pluralizar(dias)}`;
  }
  const pasados = Math.abs(dias);
  return `Pasó hace ${pasados} ${pluralizar(pasados)}`;
}

export function diasRestantes(orden: OrdenTrabajo, contexto: ContextoPlazo): number {
  const hoy = partesFecha(fechaCalendario(contexto.hoy, contexto.zonaHoraria));
  const entrega = partesFecha(orden.fechaEntrega);
  if (hoy === null || entrega === null) {
    return 0;
  }
  return ordinalCalendario(...entrega) - ordinalCalendario(...hoy);
}
