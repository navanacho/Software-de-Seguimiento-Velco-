import type { EtapaTarjeta, TarjetaOrdenDTO } from '@velco/domain';

export interface EtapaDetalleDTO extends EtapaTarjeta {
  readonly horasVendidas: string;
}

export interface DetalleOpDTO extends Omit<TarjetaOrdenDTO, 'etapas'> {
  readonly etapas: readonly EtapaDetalleDTO[];
  readonly fechaIngreso: string;
  readonly fechaEntrega: string;
  readonly montoVendido: string;
  readonly observaciones: string | null;
  readonly horas: readonly never[];
  readonly materiales: readonly never[];
}
