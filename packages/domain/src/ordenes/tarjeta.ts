import type { ContextoPlazo, EstadoSemaforo } from '../costos/contrato.ts';
import { etiquetaPlazo } from '../costos/plazo.ts';
import { diasRestantes } from '../costos/plazo.ts';
import { calcularSemaforo } from '../costos/semaforo.ts';
import type { EtapaOrden } from '../etapas/contrato.ts';
import { calcularHorasVendidasTotales } from '../etapas/horas-vendidas.ts';
import { ordenarPorSecuencia } from '../etapas/orden.ts';
import { calcularConsumoHoras, calcularHorasRealesTotales, evaluarAlertaDesvio } from '../horas/reglas.ts';
import { calcularAvance } from './avance.ts';
import type { OrdenTrabajo } from './contrato.ts';
import { etapaAhora } from './etapa-ahora.ts';

export interface ContextoTarjeta extends ContextoPlazo {
  readonly clienteNombre?: string;
  readonly valorHoraEstandar?: string;
}

export interface EtapaTarjeta {
  readonly id: string;
  readonly nombre: string;
  readonly ordenSecuencia: number;
  readonly completada: boolean;
}

export interface TarjetaOrdenDTO {
  readonly id: string;
  readonly numeroOp: string;
  readonly codigoPlano: string | null;
  readonly clienteId: string;
  readonly clienteNombre: string | null;
  readonly descripcionPieza: string;
  readonly etapas: readonly EtapaTarjeta[];
  readonly avance: number;
  readonly semaforo: EstadoSemaforo;
  readonly diasRestantes: number;
  readonly etapaAhora: string;
  readonly etiquetaPlazo: string;
  readonly horasVendidasTotales: string;
  readonly horasRealesTotales: string;
  readonly porcentajeConsumo: string | null;
  readonly alertaDesvio: boolean;
}

export function construirTarjetaOrden(
  orden: OrdenTrabajo,
  etapas: readonly EtapaOrden[],
  contexto: ContextoTarjeta,
  horasReales: readonly string[] = [],
): TarjetaOrdenDTO {
  const avance = calcularAvance(etapas);
  const semaforo = calcularSemaforo(orden, etapas, contexto, avance);
  const dias = diasRestantes(orden, contexto);
  const actual = etapaAhora(etapas);
  const horasVendidasTotales = calcularHorasVendidasTotales(etapas.map((etapa) => etapa.horasVendidas));
  const horasRealesTotales = calcularHorasRealesTotales(horasReales);
  const porcentajeConsumo = calcularConsumoHoras(horasRealesTotales, horasVendidasTotales);
  const alertaDesvio = evaluarAlertaDesvio({
    consumo: porcentajeConsumo,
    avance,
    horasReales: horasRealesTotales,
    horasVendidas: horasVendidasTotales,
  });

  return {
    id: orden.id,
    numeroOp: orden.numeroOp,
    codigoPlano: orden.codigoPlano,
    clienteId: orden.clienteId,
    clienteNombre: contexto.clienteNombre ?? null,
    descripcionPieza: orden.descripcionPieza,
    etapas: ordenarPorSecuencia(etapas).map((etapa) => ({
      id: etapa.id,
      nombre: etapa.nombre,
      ordenSecuencia: etapa.ordenSecuencia,
      completada: etapa.completada,
    })),
    avance,
    semaforo,
    diasRestantes: dias,
    etapaAhora: actual === 'Todo listo' ? actual : actual.nombre,
    etiquetaPlazo: etiquetaPlazo(dias, semaforo),
    horasVendidasTotales,
    horasRealesTotales,
    porcentajeConsumo,
    alertaDesvio,
  };
}
