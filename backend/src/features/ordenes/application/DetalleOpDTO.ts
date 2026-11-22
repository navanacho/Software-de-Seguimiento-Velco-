import type { EtapaTarjeta, MaterialOrden, TarjetaOrdenDTO } from '@velco/domain';

export interface EtapaDetalleDTO extends EtapaTarjeta {
  readonly horasVendidas: string;
}

export interface MaterialDetalleDTO extends MaterialOrden {}

export interface DetalleOpDTO extends Omit<TarjetaOrdenDTO, 'etapas'> {
  readonly etapas: readonly EtapaDetalleDTO[];
  readonly fechaIngreso: string;
  readonly fechaEntrega: string;
  readonly montoVendido: string;
  readonly observaciones: string | null;
  readonly horas: readonly never[];
  readonly materiales: readonly MaterialDetalleDTO[];
  readonly costoMaterialesCotizado: string;
  readonly costoMaterialesReal: string;
}
