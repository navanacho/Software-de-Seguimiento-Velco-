import type { NuevaOrdenTrabajo, OrdenTrabajo } from '@velco/domain';
import type { OrdenConEtapasYCliente } from './OrdenConEtapasYCliente.ts';

export interface ActualizacionOrdenTrabajo {
  readonly numeroOp: string;
  readonly codigoPlano: string | null;
  readonly clienteId: string;
  readonly descripcionPieza: string;
  readonly fechaEntrega: string;
  readonly montoVendido: string;
  readonly observaciones: string | null;
}

export interface OpRepository {
  crear(datos: NuevaOrdenTrabajo): Promise<OrdenTrabajo>;
  actualizar(id: string, datos: ActualizacionOrdenTrabajo): Promise<OrdenTrabajo | null>;
  buscarPorId(id: string): Promise<OrdenTrabajo | null>;
  buscarPorNumeroOp(numeroOp: string): Promise<OrdenTrabajo | null>;
  buscarPorCodigoPlano(codigo: string, opIdExcluida?: string): Promise<OrdenTrabajo | null>;
  listarConEtapas(): Promise<readonly OrdenConEtapasYCliente[]>;
}
