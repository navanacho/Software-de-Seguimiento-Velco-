import type { ClienteRepository } from '../../../clientes/application/ports/ClienteRepository.ts';
import type { EtapaRepository } from '../../../etapas/application/ports/EtapaRepository.ts';
import type { MaterialRepository } from '../../../materiales/application/ports/MaterialRepository.ts';
import type { OpRepository } from './OpRepository.ts';

export interface RepositoriosOpsTx {
  readonly ops: OpRepository;
  readonly etapas: EtapaRepository;
  readonly clientes: ClienteRepository;
  readonly materiales: MaterialRepository;
}

export interface UnidadTrabajoOps {
  ejecutar<T>(operacion: (repos: RepositoriosOpsTx) => Promise<T>): Promise<T>;
}
