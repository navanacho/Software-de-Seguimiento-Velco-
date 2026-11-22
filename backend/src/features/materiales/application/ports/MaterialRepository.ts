import type { MaterialOrden, NuevoMaterialOrden } from '@velco/domain';

export interface MaterialRepository {
  crearVarios(ordenId: string, materiales: readonly NuevoMaterialOrden[]): Promise<readonly MaterialOrden[]>;
  listarPorOrden(ordenId: string): Promise<readonly MaterialOrden[]>;
}
