import type { TipoMaterial } from '@velco/domain';

export interface ClienteOpcion {
  readonly id: string;
  readonly nombre: string;
}

export interface EtapaFormulario {
  readonly id?: string;
  readonly nombre: string;
  readonly horasVendidas: string;
}

export interface MaterialFormulario {
  readonly tipo: TipoMaterial;
  readonly descripcion: string;
  readonly cantidad: string;
  readonly unidad: string | null;
  readonly costoUnitarioCotizado: string;
}

export interface ValoresFormulario {
  readonly numeroOp: string;
  readonly codigoPlano: string | null;
  readonly clienteNombre: string;
  readonly descripcionPieza: string;
  readonly fechaEntrega: string;
  readonly montoVendido: string;
  readonly observaciones: string | null;
  readonly etapas: readonly EtapaFormulario[];
  readonly etapasModificadas: boolean;
  readonly materiales: readonly MaterialFormulario[];
}

export interface ErroresFormulario {
  readonly campos: Readonly<Record<string, string>>;
  readonly mensaje?: string;
  readonly opExistente?: { readonly id: string; readonly numeroOp: string };
}
