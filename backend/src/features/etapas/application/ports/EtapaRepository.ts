import type { EtapaOrden, NuevaEtapa } from '@velco/domain';

export interface EtapaRepository {
  crearVarias(ordenId: string, etapas: readonly NuevaEtapa[]): Promise<readonly EtapaOrden[]>;
  listarPorOrden(ordenId: string): Promise<readonly EtapaOrden[]>;
  buscarPorId(id: string): Promise<EtapaOrden | null>;
  actualizarCompletada(id: string, completada: boolean): Promise<EtapaOrden | null>;
}
