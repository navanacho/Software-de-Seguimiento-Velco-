import type { EtapaOrden, NuevaEtapa } from '@velco/domain';
import { Prisma, type PrismaClient } from '@prisma/client';
import type { EtapaRepository } from '../application/ports/EtapaRepository.ts';
import { aEtapaOrden } from './mappers.ts';

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

  async buscarPorId(id: string): Promise<EtapaOrden | null> {
    const fila = await this.prisma.etapaOrden.findUnique({ where: { id } });
    return fila ? aEtapaOrden(fila) : null;
  }

  async actualizarCompletada(id: string, completada: boolean): Promise<EtapaOrden | null> {
    try {
      const fila = await this.prisma.etapaOrden.update({
        where: { id },
        data: { completada },
      });
      return aEtapaOrden(fila);
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return null;
      }
      throw error;
    }
  }
}
