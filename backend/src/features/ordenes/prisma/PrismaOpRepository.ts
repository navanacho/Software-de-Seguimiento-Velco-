import type { NuevaOrdenTrabajo, OrdenTrabajo } from '@velco/domain';
import { Prisma, type OrdenTrabajo as OrdenTrabajoPrisma, type PrismaClient } from '@prisma/client';
import { aEtapaOrden } from '../../etapas/prisma/mappers.ts';
import type { OpRepository } from '../application/ports/OpRepository.ts';
import type { OrdenConEtapasYCliente } from '../application/ports/OrdenConEtapasYCliente.ts';

type FilaConEtapasYCliente = Prisma.OrdenTrabajoGetPayload<{
  include: { etapas: true; cliente: true };
}>;

function aOrdenTrabajo(fila: OrdenTrabajoPrisma): OrdenTrabajo {
  return {
    id: fila.id,
    numeroOp: fila.numeroOp,
    clienteId: fila.clienteId,
    descripcionPieza: fila.descripcionPieza,
    fechaIngreso: fila.fechaIngreso.toISOString().slice(0, 10),
    fechaEntrega: fila.fechaEntrega.toISOString().slice(0, 10),
    montoVendido: fila.montoVendido.toFixed(2),
    observaciones: fila.observaciones,
    createdAt: fila.createdAt.toISOString(),
    updatedAt: fila.updatedAt.toISOString(),
  };
}

export class PrismaOpRepository implements OpRepository {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async crear(datos: NuevaOrdenTrabajo): Promise<OrdenTrabajo> {
    const fila = await this.prisma.ordenTrabajo.create({
      data: {
        numeroOp: datos.numeroOp,
        clienteId: datos.clienteId,
        descripcionPieza: datos.descripcionPieza,
        fechaEntrega: new Date(datos.fechaEntrega),
        montoVendido: new Prisma.Decimal(datos.montoVendido),
        observaciones: datos.observaciones ?? null,
      },
    });
    return aOrdenTrabajo(fila);
  }

  async buscarPorId(id: string): Promise<OrdenTrabajo | null> {
    const fila = await this.prisma.ordenTrabajo.findUnique({ where: { id } });
    return fila ? aOrdenTrabajo(fila) : null;
  }

  async buscarPorNumeroOp(numeroOp: string): Promise<OrdenTrabajo | null> {
    const fila = await this.prisma.ordenTrabajo.findUnique({ where: { numeroOp } });
    return fila ? aOrdenTrabajo(fila) : null;
  }

  async listarConEtapas(): Promise<readonly OrdenConEtapasYCliente[]> {
    const filas: readonly FilaConEtapasYCliente[] = await this.prisma.ordenTrabajo.findMany({
      include: {
        etapas: { orderBy: { ordenSecuencia: 'asc' } },
        cliente: true,
      },
    });
    return filas.map((fila) => ({
      orden: aOrdenTrabajo(fila),
      etapas: fila.etapas.map(aEtapaOrden),
      clienteNombre: fila.cliente?.nombre ?? null,
    }));
  }
}
