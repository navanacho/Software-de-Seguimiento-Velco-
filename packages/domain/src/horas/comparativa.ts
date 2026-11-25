import {
  calcularConsumoHoras,
  calcularDesvioHoras,
  calcularHorasRealesTotales,
  calcularHorasVendidasTotales,
  evaluarAlertaDesvio,
} from './reglas.ts';

export interface EtapaParaComparativa {
  readonly id: string;
  readonly nombre: string;
  readonly horasVendidas: string;
}

export interface ParteParaComparativa {
  readonly etapaId: string | null;
  readonly horas: string;
}

export interface EntradaComparativaPorEtapa {
  readonly etapas: readonly EtapaParaComparativa[];
  readonly partes: readonly ParteParaComparativa[];
  readonly avance: number;
}

export interface FilaComparativaPorEtapa {
  readonly etapaId: string | null;
  readonly nombreEtapa: string;
  readonly horasVendidas: string;
  readonly horasReales: string;
  readonly desvioHoras: string;
  readonly porcentajeConsumo: string | null;
  readonly alertaDesvio: boolean;
}

function construirFila(
  etapaId: string | null,
  nombreEtapa: string,
  horasVendidas: readonly string[],
  horasReales: readonly string[],
  avance: number,
): FilaComparativaPorEtapa {
  const vendidas = calcularHorasVendidasTotales(horasVendidas);
  const reales = calcularHorasRealesTotales(horasReales);
  const porcentajeConsumo = calcularConsumoHoras(reales, vendidas);
  return {
    etapaId,
    nombreEtapa,
    horasVendidas: vendidas,
    horasReales: reales,
    desvioHoras: calcularDesvioHoras(horasVendidas, horasReales),
    porcentajeConsumo,
    alertaDesvio: evaluarAlertaDesvio({
      consumo: porcentajeConsumo,
      avance,
      horasReales: reales,
      horasVendidas: vendidas,
    }),
  };
}

export function comparativaPorEtapa(entrada: EntradaComparativaPorEtapa): readonly FilaComparativaPorEtapa[] {
  const filas = entrada.etapas.map((etapa) => {
    const horasReales = entrada.partes
      .filter((parte) => parte.etapaId === etapa.id)
      .map((parte) => parte.horas);
    return construirFila(etapa.id, etapa.nombre, [etapa.horasVendidas], horasReales, entrada.avance);
  });
  const horasSinEtapa = entrada.partes
    .filter((parte) => parte.etapaId === null)
    .map((parte) => parte.horas);
  if (horasSinEtapa.length > 0) {
    return [
      ...filas,
      construirFila(null, 'Sin etapa', [], horasSinEtapa, entrada.avance),
    ];
  }
  return filas;
}
