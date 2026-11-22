import type { NuevaOrdenTrabajo, OrdenTrabajo } from '@velco/domain';
import { Prisma, type OrdenTrabajo as OrdenTrabajoPrisma, type PrismaClient } from '@prisma/client';

type ClientePrisma = PrismaClient | Prisma.TransactionClient;
import { aEtapaOrden } from '../../etapas/prisma/mappers.ts';
import { CodigoPlanoDuplicadoError, NumeroOpDuplicadoError } from '../../../shared/errores.ts';
import type { ActualizacionOrdenTrabajo, OpRepository } from '../application/ports/OpRepository.ts';
import type { OrdenConEtapasYCliente } from '../application/ports/OrdenConEtapasYCliente.ts';

type FilaConEtapasYCliente = Prisma.OrdenTrabajoGetPayload<{
  include: { etapas: true; cliente: true };
}>;

function aOrdenTrabajo(fila: OrdenTrabajoPrisma): OrdenTrabajo {
  return {
    id: fila.id,
    numeroOp: fila.numeroOp,
    codigoPlano: fila.codigoPlano ?? null,
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
  private readonly prisma: ClientePrisma;

  constructor(prisma: ClientePrisma) {
    this.prisma = prisma;
  }

  async crear(datos: NuevaOrdenTrabajo): Promise<OrdenTrabajo> {
    try {
      const fila = await this.prisma.ordenTrabajo.create({
        data: {
          numeroOp: datos.numeroOp,
          codigoPlano: datos.codigoPlano ?? null,
          clienteId: datos.clienteId,
          descripcionPieza: datos.descripcionPieza,
          fechaEntrega: new Date(datos.fechaEntrega),
          montoVendido: new Prisma.Decimal(datos.montoVendido),
          observaciones: datos.observaciones ?? null,
        },
      });
      return aOrdenTrabajo(fila);
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const meta = error.meta as { target?: unknown; driverAdapterError?: { cause?: { constraint?: { fields?: unknown; index?: unknown }; fields?: unknown } } } | undefined;
        const targetRaw = meta?.target;
        const target = Array.isArray(targetRaw) ? targetRaw.join(',') : String(targetRaw ?? '');
        const constraint = meta?.driverAdapterError?.cause?.constraint;
        const constraintFields = Array.isArray(constraint?.fields) ? constraint.fields.join(',') : String(constraint?.fields ?? '');
        const constraintIndex = String(constraint?.index ?? '');
        const huella = `${target},${constraintFields},${constraintIndex}`;
        if (huella.includes('codigo_plano')) {
          const codigoPlano = datos.codigoPlano ?? '';
          const existente = await this.buscarPorCodigoPlano(codigoPlano);
          if (existente) {
            throw new CodigoPlanoDuplicadoError(codigoPlano, {
              id: existente.id,
              numeroOp: existente.numeroOp,
            });
          }
        }
        if (huella.includes('numero_op')) {
          throw new NumeroOpDuplicadoError(datos.numeroOp);
        }
      }
      throw error;
    }
  }

  async buscarPorId(id: string): Promise<OrdenTrabajo | null> {
    const fila = await this.prisma.ordenTrabajo.findUnique({ where: { id } });
    return fila ? aOrdenTrabajo(fila) : null;
  }

  async buscarPorNumeroOp(numeroOp: string): Promise<OrdenTrabajo | null> {
    const fila = await this.prisma.ordenTrabajo.findUnique({ where: { numeroOp } });
    return fila ? aOrdenTrabajo(fila) : null;
  }

  async actualizar(id: string, datos: ActualizacionOrdenTrabajo): Promise<OrdenTrabajo | null> {
    try {
      const fila = await this.prisma.ordenTrabajo.update({
        where: { id },
        data: {
          numeroOp: datos.numeroOp,
          codigoPlano: datos.codigoPlano,
          clienteId: datos.clienteId,
          descripcionPieza: datos.descripcionPieza,
          fechaEntrega: new Date(datos.fechaEntrega),
          montoVendido: new Prisma.Decimal(datos.montoVendido),
          observaciones: datos.observaciones,
        },
      });
      return aOrdenTrabajo(fila);
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') return null;
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const meta = error.meta as { target?: unknown; driverAdapterError?: { cause?: { constraint?: { fields?: unknown; index?: unknown } } } } | undefined;
        const target = Array.isArray(meta?.target) ? meta.target.join(',') : String(meta?.target ?? '');
        const constraint = meta?.driverAdapterError?.cause?.constraint;
        const huella = `${target},${Array.isArray(constraint?.fields) ? constraint.fields.join(',') : String(constraint?.fields ?? '')},${String(constraint?.index ?? '')}`;
        if (huella.includes('codigo_plano')) {
          const existente = await this.buscarPorCodigoPlano(datos.codigoPlano ?? '', id);
          if (existente && datos.codigoPlano) throw new CodigoPlanoDuplicadoError(datos.codigoPlano, { id: existente.id, numeroOp: existente.numeroOp });
        }
        if (huella.includes('numero_op')) throw new NumeroOpDuplicadoError(datos.numeroOp);
      }
      throw error;
    }
  }

  async buscarPorCodigoPlano(codigo: string, opIdExcluida?: string): Promise<OrdenTrabajo | null> {
    const fila = await this.prisma.ordenTrabajo.findFirst({
      where: {
        codigoPlano: codigo,
        ...(opIdExcluida !== undefined ? { id: { not: opIdExcluida } } : {}),
      },
    });
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
