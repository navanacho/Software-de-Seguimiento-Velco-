import type { EstadoSemaforo, EtapaTarjeta, FilaComparativaPorEtapa, GrupoFlujo, RegistroHora, TarjetaOrdenDTO, TipoMaterial } from '@velco/domain';

export interface KpisTablero {
  readonly total: number;
  readonly porEstado: Record<EstadoSemaforo, number>;
}

export interface RespuestaListadoTablero {
  readonly ops: readonly TarjetaOrdenDTO[];
  readonly kpis: KpisTablero;
  readonly flujo: readonly GrupoFlujo[];
}

export interface EtapaDetalleDTO extends EtapaTarjeta {
  readonly horasVendidas: string;
}

export interface MaterialDetalleDTO {
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

export type ParteHoraDTO = RegistroHora;

export type DetalleOpDTO = Omit<TarjetaOrdenDTO, 'etapas'> & {
  readonly etapas: readonly EtapaDetalleDTO[];
  readonly fechaIngreso: string;
  readonly fechaEntrega: string;
  readonly montoVendido: string;
  readonly observaciones: string | null;
  readonly horas: readonly ParteHoraDTO[];
  readonly horasRealesTotales: string;
  readonly desvioHoras: string;
  readonly materiales: readonly MaterialDetalleDTO[];
  readonly costoMaterialesCotizado: string;
  readonly costoMaterialesReal: string;
  readonly comparativaPorEtapa: readonly FilaComparativaPorEtapa[];
  readonly margenReal: string;
  readonly tasaGlobalNoConfigurada: boolean;
};

export interface ClienteCreado {
  readonly id: string;
  readonly nombre: string;
  readonly createdAt: string;
}
