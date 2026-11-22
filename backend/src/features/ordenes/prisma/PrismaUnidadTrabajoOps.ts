import type { Prisma, PrismaClient } from '@prisma/client';
import { PrismaClienteRepository } from '../../clientes/prisma/PrismaClienteRepository.ts';
import { PrismaEtapaRepository } from '../../etapas/prisma/PrismaEtapaRepository.ts';
import { PrismaMaterialRepository } from '../../materiales/prisma/PrismaMaterialRepository.ts';
import { PrismaOpRepository } from './PrismaOpRepository.ts';
import type { RepositoriosOpsTx, UnidadTrabajoOps } from '../application/ports/UnidadTrabajoOps.ts';

type ClientePrismaTx = Prisma.TransactionClient;

export function crearRepositoriosOpsTx(
  prisma: ClientePrismaTx,
  enTransaccion = false,
): RepositoriosOpsTx {
  return {
    ops: new PrismaOpRepository(prisma),
    etapas: new PrismaEtapaRepository(prisma, enTransaccion),
    clientes: new PrismaClienteRepository(prisma),
    materiales: new PrismaMaterialRepository(prisma),
  };
}

export class PrismaUnidadTrabajoOps implements UnidadTrabajoOps {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async ejecutar<T>(operacion: (repos: RepositoriosOpsTx) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => operacion(crearRepositoriosOpsTx(tx, true)));
  }
}
