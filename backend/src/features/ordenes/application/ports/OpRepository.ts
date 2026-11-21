import type { NuevaOrdenTrabajo, OrdenTrabajo } from '@velco/domain';
import type { OrdenConEtapasYCliente } from './OrdenConEtapasYCliente.ts';

export interface OpRepository {
  crear(datos: NuevaOrdenTrabajo): Promise<OrdenTrabajo>;
  buscarPorId(id: string): Promise<OrdenTrabajo | null>;
  buscarPorNumeroOp(numeroOp: string): Promise<OrdenTrabajo | null>;
  listarConEtapas(): Promise<readonly OrdenConEtapasYCliente[]>;
}
