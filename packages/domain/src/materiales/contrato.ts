export const TIPOS_MATERIAL = ['MP', 'INSUMOS', 'TERCERIZADOS'] as const;
export type TipoMaterial = (typeof TIPOS_MATERIAL)[number];

export interface MaterialOrden {
  readonly id: string;
  readonly ordenId: string;
  readonly tipo: TipoMaterial;
  readonly descripcion: string;
  readonly cantidad: string;
  readonly unidad: string | null;
  readonly costoUnitarioCotizado: string;
  readonly costoUnitarioReal: string | null;
  readonly nroRemito: string | null;
  readonly nroFactura: string | null;
  readonly nt: string | null;
  readonly po: string | null;
}

export interface NuevoMaterialOrden {
  readonly tipo: TipoMaterial;
  readonly descripcion: string;
  readonly cantidad: string;
  readonly unidad?: string | null;
  readonly costoUnitarioCotizado: string;
  readonly costoUnitarioReal?: string | null;
  readonly nroRemito?: string | null;
  readonly nroFactura?: string | null;
  readonly nt?: string | null;
  readonly po?: string | null;
}
