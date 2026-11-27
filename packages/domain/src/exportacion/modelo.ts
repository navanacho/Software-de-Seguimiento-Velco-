import type { Decimal } from '../decimal/operaciones.ts';
import type { FilaComparativaPorEtapa } from '../horas/comparativa.ts';
import type { TipoMaterial } from '../materiales/contrato.ts';
import { costoMaterialReal, costoMaterialesCotizado, margenReal } from '../margen/reglas.ts';

export interface MaterialOperativoModeloPlanilla {
  readonly tipo: TipoMaterial;
  readonly descripcion: string;
  readonly cantidad: Decimal;
  readonly unidad: string | null;
}

export interface MaterialModeloPlanilla extends MaterialOperativoModeloPlanilla {
  readonly costoUnitarioCotizado: Decimal;
  readonly costoUnitarioReal: Decimal | null;
}

export interface EntradaModeloPlanilla {
  readonly cliente: string;
  readonly numeroOp: string;
  readonly materiales: readonly MaterialModeloPlanilla[];
  readonly horasVendidas: Decimal;
  readonly horasReales: Decimal;
  readonly valorHora: Decimal;
  readonly montoVendido: Decimal;
  readonly comparativa: readonly FilaComparativaPorEtapa[];
  readonly incluirMargenes: boolean;
}

interface CamposComunesModelo {
  readonly cliente: string;
  readonly numeroOp: string;
  readonly horasVendidas: Decimal;
  readonly horasReales: Decimal;
  readonly valorHora: Decimal;
  readonly comparativa: readonly FilaComparativaPorEtapa[];
}

type VarianteCosteoModelo = CamposComunesModelo & {
  readonly variante: 'costeo';
  readonly materiales: readonly MaterialModeloPlanilla[];
  readonly costos: {
    readonly costoMaterialesCotizado: Decimal;
    readonly costoMaterialesReal: Decimal;
  };
  readonly margenReal: Decimal;
};

type VarianteOperativaModelo = CamposComunesModelo & {
  readonly variante: 'operativa';
  readonly materiales: readonly MaterialOperativoModeloPlanilla[];
};

export type ModeloPlanilla = VarianteCosteoModelo | VarianteOperativaModelo;

function camposComunes<TMateriales extends readonly (MaterialModeloPlanilla | MaterialOperativoModeloPlanilla)[]>(
  entrada: EntradaModeloPlanilla,
  materiales: TMateriales,
) {
  return {
    cliente: entrada.cliente,
    numeroOp: entrada.numeroOp,
    materiales,
    horasVendidas: entrada.horasVendidas,
    horasReales: entrada.horasReales,
    valorHora: entrada.valorHora,
    comparativa: entrada.comparativa,
  };
}

export function construirModeloPlanilla(entrada: EntradaModeloPlanilla): ModeloPlanilla {
  if (!entrada.incluirMargenes) {
    const materiales = entrada.materiales.map(({ tipo, descripcion, cantidad, unidad }) => ({
      tipo,
      descripcion,
      cantidad,
      unidad,
    }));
    return { ...camposComunes(entrada, materiales), variante: 'operativa' };
  }
  const costoMaterialesReal = costoMaterialReal(entrada.materiales);
  return {
    ...camposComunes(
      entrada,
      entrada.materiales.map(
        ({ tipo, descripcion, cantidad, unidad, costoUnitarioCotizado, costoUnitarioReal }) => ({
          tipo,
          descripcion,
          cantidad,
          unidad,
          costoUnitarioCotizado,
          costoUnitarioReal,
        }),
      ),
    ),
    variante: 'costeo',
    costos: {
      costoMaterialesCotizado: costoMaterialesCotizado(entrada.materiales),
      costoMaterialesReal,
    },
    margenReal: margenReal({
      montoVendido: entrada.montoVendido,
      horasRealesTotales: entrada.horasReales,
      costoMaterialesReal,
      valorHoraEstandar: entrada.valorHora,
    }),
  };
}
