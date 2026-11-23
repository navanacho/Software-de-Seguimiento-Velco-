import type { PrismaClient } from '@prisma/client';
import type { UnidadTrabajoHoras } from '../application/ports/UnidadTrabajoHoras.ts';
import { PrismaEtapaRepository } from '../../etapas/prisma/PrismaEtapaRepository.ts';
import { PrismaOpRepository } from '../../ordenes/prisma/PrismaOpRepository.ts';
import { PrismaRegistroHoraRepository } from './PrismaRegistroHoraRepository.ts';

export class PrismaUnidadTrabajoHoras implements UnidadTrabajoHoras {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  ejecutar<T>(
    operacion: (repos: {
      horas: PrismaRegistroHoraRepository;
      ops: PrismaOpRepository;
      etapas: PrismaEtapaRepository;
    }) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) =>
      operacion({
        horas: new PrismaRegistroHoraRepository(tx),
        ops: new PrismaOpRepository(tx),
        etapas: new PrismaEtapaRepository(tx),
      }),
    );
  }
}
