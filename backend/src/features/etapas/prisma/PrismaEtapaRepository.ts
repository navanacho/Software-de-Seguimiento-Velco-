import type { EtapaOrden, NuevaEtapa } from '@velco/domain';
import { Prisma, type EtapaOrden as EtapaOrdenPrisma, type PrismaClient } from '@prisma/client';
import type { EtapaRepository } from '../application/ports/EtapaRepository.ts';

function aEtapaOrden(fila: EtapaOrdenPrisma): EtapaOrden {
  return {
    id: fila.id,
    ordenId: fila.ordenId,
    nombre: fila.nombre,
    ordenSecuencia: fila.ordenSecuencia,
    completada: fila.completada,
    horasVendidas: fila.horasVendidas.toFixed(2),
  };
}

export class PrismaEtapaRepository implements EtapaRepository {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async crearVarias(ordenId: string, etapas: readonly NuevaEtapa[]): Promise<readonly EtapaOrden[]> {
    const filas = await this.prisma.$transaction(
      etapas.map((etapa) =>
        this.prisma.etapaOrden.create({
          data: {
            ordenId,
            nombre: etapa.nombre,
            ordenSecuencia: etapa.ordenSecuencia,
            horasVendidas: new Prisma.Decimal(etapa.horasVendidas ?? '0'),
          },
        }),
      ),
    );
    return filas.map(aEtapaOrden);
  }

  async listarPorOrden(ordenId: string): Promise<readonly EtapaOrden[]> {
    const filas = await this.prisma.etapaOrden.findMany({
      where: { ordenId },
      orderBy: { ordenSecuencia: 'asc' },
    });
    return filas.map(aEtapaOrden);
  }
}
