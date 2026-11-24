import { Prisma, type PrismaClient } from '@prisma/client';
import type { NuevoRegistroHora, RegistroHora } from '@velco/domain';
import type { RegistroHoraRepository } from '../application/ports/RegistroHoraRepository.ts';

type ClientePrisma = PrismaClient | Prisma.TransactionClient;

function aRegistroHora(fila: {
  id: string;
  ordenId: string;
  etapaId: string | null;
  operario: string;
  fecha: Date;
  horas: Prisma.Decimal;
  createdAt: Date;
  observacion: string | null;
}): RegistroHora {
  return {
    id: fila.id,
    ordenId: fila.ordenId,
    etapaId: fila.etapaId,
    operario: fila.operario,
    fecha: fila.fecha.toISOString().slice(0, 10),
    horas: fila.horas.toFixed(2),
    createdAt: fila.createdAt.toISOString(),
    observacion: fila.observacion,
  };
}

export class PrismaRegistroHoraRepository implements RegistroHoraRepository {
  private readonly prisma: ClientePrisma;

  constructor(prisma: ClientePrisma) {
    this.prisma = prisma;
  }

  async crear(datos: NuevoRegistroHora): Promise<RegistroHora> {
    const fila = await this.prisma.registroHora.create({
      data: {
        ordenId: datos.ordenId,
        etapaId: datos.etapaId ?? null,
        operario: datos.operario,
        fecha: new Date(`${datos.fecha}T00:00:00.000Z`),
        horas: new Prisma.Decimal(datos.horas),
        observacion: datos.observacion ?? null,
      },
    });
    return aRegistroHora(fila);
  }

  async listarPorOrden(ordenId: string): Promise<readonly RegistroHora[]> {
    const filas = await this.prisma.registroHora.findMany({
      where: { ordenId },
      orderBy: [{ fecha: 'asc' }, { createdAt: 'asc' }],
    });
    return filas.map(aRegistroHora);
  }

  async listarPorOrdenes(ordenIds: readonly string[]): Promise<readonly RegistroHora[]> {
    if (ordenIds.length === 0) return [];
    const filas = await this.prisma.registroHora.findMany({
      where: { ordenId: { in: [...ordenIds] } },
      orderBy: [{ fecha: 'asc' }, { createdAt: 'asc' }],
    });
    return filas.map(aRegistroHora);
  }

  async buscarPorId(id: string): Promise<RegistroHora | null> {
    const fila = await this.prisma.registroHora.findUnique({ where: { id } });
    return fila ? aRegistroHora(fila) : null;
  }

  async actualizar(id: string, datos: Partial<Omit<NuevoRegistroHora, 'ordenId'>>): Promise<RegistroHora | null> {
    try {
      const data: Prisma.RegistroHoraUpdateInput = {};
      if (datos.etapaId !== undefined) data.etapa = datos.etapaId === null ? { disconnect: true } : { connect: { id: datos.etapaId } };
      if (datos.operario !== undefined) data.operario = datos.operario;
      if (datos.fecha !== undefined) data.fecha = new Date(`${datos.fecha}T00:00:00.000Z`);
      if (datos.horas !== undefined) data.horas = new Prisma.Decimal(datos.horas);
      if (datos.observacion !== undefined) data.observacion = datos.observacion;
      const fila = await this.prisma.registroHora.update({ where: { id }, data });
      return aRegistroHora(fila);
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') return null;
      throw error;
    }
  }

  async eliminar(id: string): Promise<boolean> {
    try {
      await this.prisma.registroHora.delete({ where: { id } });
      return true;
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') return false;
      throw error;
    }
  }
}
