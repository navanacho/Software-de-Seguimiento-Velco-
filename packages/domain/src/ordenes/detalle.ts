import { comparativaPorEtapa, type FilaComparativaPorEtapa } from '../horas/comparativa.ts';
import type { RegistroHora } from '../horas/reglas.ts';
import { calcularConsumoHoras, calcularDesvioHoras, evaluarAlertaDesvio } from '../horas/reglas.ts';
import type { EtapaOrden } from '../etapas/contrato.ts';
import { costoMaterialReal, costoMaterialesCotizado, margenReal, tasaGlobalNoConfigurada } from '../margen/reglas.ts';
import type { MaterialOrden } from '../materiales/contrato.ts';
import type { OrdenTrabajo } from './contrato.ts';
import type { EtapaTarjeta, TarjetaOrdenDTO } from './tarjeta.ts';

export interface EtapaDetalleDTO extends EtapaTarjeta {
  readonly horasVendidas: string;
}

export type MaterialDetalleDTO = MaterialOrden;
export type ParteHoraDTO = RegistroHora;

export interface DetalleOpDTO extends Omit<TarjetaOrdenDTO, 'etapas'> {
  readonly etapas: readonly EtapaDetalleDTO[];
  readonly fechaIngreso: string;
  readonly fechaEntrega: string;
  readonly montoVendido: string;
  readonly observaciones: string | null;
  readonly horas: readonly ParteHoraDTO[];
  readonly desvioHoras: string;
  readonly materiales: readonly MaterialDetalleDTO[];
  readonly costoMaterialesCotizado: string;
  readonly costoMaterialesReal: string;
  readonly comparativaPorEtapa: readonly FilaComparativaPorEtapa[];
  readonly margenReal: string;
  readonly tasaGlobalNoConfigurada: boolean;
}

export interface EntradaDetalleOp {
  readonly tarjeta: TarjetaOrdenDTO;
  readonly orden: Pick<OrdenTrabajo, 'fechaIngreso' | 'fechaEntrega' | 'montoVendido' | 'observaciones'>;
  readonly etapas: readonly EtapaOrden[];
  readonly horas: readonly RegistroHora[];
  readonly materiales: readonly MaterialOrden[];
  readonly valorHoraEstandar: string;
}

export function construirDetalleOp(entrada: EntradaDetalleOp): DetalleOpDTO {
  const { tarjeta } = entrada;
  const horasPorId = new Map(entrada.etapas.map((etapa) => [etapa.id, etapa.horasVendidas]));
  const etapasDetalle = tarjeta.etapas.map((etapa) => {
    const horasVendidas = horasPorId.get(etapa.id);
    if (horasVendidas === undefined) {
      throw new Error(`la etapa ${etapa.id} no tiene horasVendidas mapeadas`);
    }
    return { ...etapa, horasVendidas };
  });
  const comparativaPorEtapaCalculada = comparativaPorEtapa({
    etapas: entrada.etapas.map((etapa) => ({
      id: etapa.id,
      nombre: etapa.nombre,
      horasVendidas: etapa.horasVendidas,
    })),
    partes: entrada.horas.map((hora) => ({ etapaId: hora.etapaId, horas: hora.horas })),
    avance: tarjeta.avance,
  });
  const costoMaterialesReal = costoMaterialReal(entrada.materiales);
  const porcentajeConsumo = calcularConsumoHoras(
    tarjeta.horasRealesTotales,
    tarjeta.horasVendidasTotales,
  );
  return {
    ...tarjeta,
    etapas: etapasDetalle,
    fechaIngreso: entrada.orden.fechaIngreso,
    fechaEntrega: entrada.orden.fechaEntrega,
    montoVendido: entrada.orden.montoVendido,
    observaciones: entrada.orden.observaciones,
    horas: entrada.horas,
    desvioHoras: calcularDesvioHoras([tarjeta.horasVendidasTotales], [tarjeta.horasRealesTotales]),
    porcentajeConsumo,
    alertaDesvio: evaluarAlertaDesvio({
      consumo: porcentajeConsumo,
      avance: tarjeta.avance,
      horasReales: tarjeta.horasRealesTotales,
      horasVendidas: tarjeta.horasVendidasTotales,
    }),
    materiales: entrada.materiales,
    costoMaterialesCotizado: costoMaterialesCotizado(entrada.materiales),
    costoMaterialesReal,
    comparativaPorEtapa: comparativaPorEtapaCalculada,
    margenReal: margenReal({
      montoVendido: entrada.orden.montoVendido,
      horasRealesTotales: tarjeta.horasRealesTotales,
      costoMaterialesReal,
      valorHoraEstandar: entrada.valorHoraEstandar,
    }),
    tasaGlobalNoConfigurada: tasaGlobalNoConfigurada(entrada.valorHoraEstandar),
  };
}
