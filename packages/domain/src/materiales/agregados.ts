import { costoMaterialReal, costoMaterialesCotizado } from '../margen/reglas.ts';

export interface MaterialParaAgregado {
  readonly cantidad: string;
  readonly costoUnitarioCotizado: string;
  readonly costoUnitarioReal: string | null;
}

export interface AgregadosMateriales {
  readonly costoMaterialesCotizado: string;
  readonly costoMaterialesReal: string;
}

export function calcularAgregadosMateriales(materiales: readonly MaterialParaAgregado[]): AgregadosMateriales {
  return {
    costoMaterialesCotizado: costoMaterialesCotizado(materiales),
    costoMaterialesReal: costoMaterialReal(materiales),
  };
}
