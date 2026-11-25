import type { Decimal } from '../decimal/operaciones.ts';
import { comparar, multiplicar, restar, sumar } from '../decimal/operaciones.ts';
import type { MaterialParaAgregado } from '../materiales/agregados.ts';

export type ItemMaterialMargen = MaterialParaAgregado;

export interface EntradaMargenReal {
  readonly montoVendido: Decimal;
  readonly horasRealesTotales: Decimal;
  readonly costoMaterialesReal: Decimal;
  readonly valorHoraEstandar: Decimal;
}

export function costoMaterialReal(materiales: readonly ItemMaterialMargen[]): Decimal {
  return materiales.reduce(
    (total, material) => sumar(total, multiplicar(material.cantidad, material.costoUnitarioReal ?? material.costoUnitarioCotizado)),
    '0.00',
  );
}

export function costoMaterialesCotizado(materiales: readonly ItemMaterialMargen[]): Decimal {
  return materiales.reduce(
    (total, material) => sumar(total, multiplicar(material.cantidad, material.costoUnitarioCotizado)),
    '0.00',
  );
}

export function margenReal(entrada: EntradaMargenReal): Decimal {
  const manoDeObra = multiplicar(entrada.horasRealesTotales, entrada.valorHoraEstandar);
  return restar(restar(entrada.montoVendido, manoDeObra), entrada.costoMaterialesReal);
}

export function tasaGlobalNoConfigurada(valorHoraEstandar: Decimal): boolean {
  return comparar(valorHoraEstandar, '0.00') === 0;
}
