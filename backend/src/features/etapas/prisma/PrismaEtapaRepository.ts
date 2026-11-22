import type { EtapaOrden, NuevaEtapa } from '@velco/domain';
import { Prisma, type PrismaClient } from '@prisma/client';
import type { EtapaRepository } from '../application/ports/EtapaRepository.ts';
import { aEtapaOrden } from './mappers.ts';

type ClientePrisma = PrismaClient | Prisma.TransactionClient;

export class PrismaEtapaRepository implements EtapaRepository {
  private readonly prisma: ClientePrisma;
  private readonly enTransaccion: boolean;

  constructor(prisma: ClientePrisma, enTransaccion = false) {
    this.prisma = prisma;
    this.enTransaccion = enTransaccion;
  }

  async crearVarias(ordenId: string, etapas: readonly NuevaEtapa[]): Promise<readonly EtapaOrden[]> {
    const crear = (etapa: NuevaEtapa) =>
      this.prisma.etapaOrden.create({
        data: {
          ordenId,
          nombre: etapa.nombre,
          ordenSecuencia: etapa.ordenSecuencia,
          horasVendidas: new Prisma.Decimal(etapa.horasVendidas ?? '0'),
        },
      });

    if (!this.enTransaccion) {
      const filas = await (this.prisma as PrismaClient).$transaction(etapas.map(crear));
      return filas.map(aEtapaOrden);
    }

    const filas: EtapaOrden[] = [];
    for (const etapa of etapas) {
      filas.push(aEtapaOrden(await crear(etapa)));
    }
    return filas;
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

  async eliminar(id: string): Promise<void> {
    try {
      await this.prisma.etapaOrden.delete({ where: { id } });
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') return;
      throw error;
    }
  }

  async actualizarSecuencia(id: string, ordenSecuencia: number): Promise<void> {
    await this.prisma.etapaOrden.update({ where: { id }, data: { ordenSecuencia } });
  }
}
