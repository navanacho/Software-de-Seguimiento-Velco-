import type { NuevaOrdenTrabajo, OrdenTrabajo } from '@velco/domain';

export interface OpRepository {
  crear(datos: NuevaOrdenTrabajo): Promise<OrdenTrabajo>;
  buscarPorId(id: string): Promise<OrdenTrabajo | null>;
  buscarPorNumeroOp(numeroOp: string): Promise<OrdenTrabajo | null>;
}
