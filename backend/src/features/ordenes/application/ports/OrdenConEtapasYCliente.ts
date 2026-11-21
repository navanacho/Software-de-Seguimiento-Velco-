import type { EtapaOrden, OrdenTrabajo } from '@velco/domain';

export interface OrdenConEtapasYCliente {
  readonly orden: OrdenTrabajo;
  readonly etapas: readonly EtapaOrden[];
  readonly clienteNombre: string | null;
}
