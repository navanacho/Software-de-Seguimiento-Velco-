import type { EtapaRepository } from '../../../etapas/application/ports/EtapaRepository.ts';
import type { OpRepository } from '../../../ordenes/application/ports/OpRepository.ts';
import type { RegistroHoraRepository } from './RegistroHoraRepository.ts';

export interface UnidadTrabajoHoras {
  ejecutar<T>(operacion: (repos: {
    horas: RegistroHoraRepository;
    ops: OpRepository;
    etapas: EtapaRepository;
  }) => Promise<T>): Promise<T>;
}
