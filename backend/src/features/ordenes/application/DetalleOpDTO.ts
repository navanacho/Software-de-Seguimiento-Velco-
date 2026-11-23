import type { EtapaTarjeta, MaterialOrden, RegistroHora, TarjetaOrdenDTO } from '@velco/domain';

export interface EtapaDetalleDTO extends EtapaTarjeta {
  readonly horasVendidas: string;
}

export interface MaterialDetalleDTO extends MaterialOrden {}

export interface ParteHoraDTO extends RegistroHora {}

export interface DetalleOpDTO extends Omit<TarjetaOrdenDTO, 'etapas'> {
  readonly etapas: readonly EtapaDetalleDTO[];
  readonly fechaIngreso: string;
  readonly fechaEntrega: string;
  readonly montoVendido: string;
  readonly observaciones: string | null;
  readonly horas: readonly ParteHoraDTO[];
  readonly horasRealesTotales: string;
  readonly desvioHoras: string;
  readonly porcentajeConsumo: string | null;
  readonly alertaDesvio: boolean;
  readonly materiales: readonly MaterialDetalleDTO[];
  readonly costoMaterialesCotizado: string;
  readonly costoMaterialesReal: string;
}
