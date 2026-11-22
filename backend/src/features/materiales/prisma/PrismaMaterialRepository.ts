import { Prisma, type PrismaClient } from '@prisma/client';
import type { MaterialOrden, NuevoMaterialOrden } from '@velco/domain';
import type { MaterialRepository } from '../application/ports/MaterialRepository.ts';

type ClientePrisma = PrismaClient | Prisma.TransactionClient;

function aMaterial(fila: {
  id: string; ordenId: string; tipo: string; descripcion: string; cantidad: Prisma.Decimal; unidad: string | null;
  costoUnitarioCotizado: Prisma.Decimal; costoUnitarioReal: Prisma.Decimal | null;
  nroRemito: string | null; nroFactura: string | null; nt: string | null; po: string | null;
}): MaterialOrden {
  return {
    id: fila.id,
    ordenId: fila.ordenId,
    tipo: fila.tipo as MaterialOrden['tipo'],
    descripcion: fila.descripcion,
    cantidad: fila.cantidad.toFixed(4),
    unidad: fila.unidad,
    costoUnitarioCotizado: fila.costoUnitarioCotizado.toFixed(2),
    costoUnitarioReal: fila.costoUnitarioReal?.toFixed(2) ?? null,
    nroRemito: fila.nroRemito,
    nroFactura: fila.nroFactura,
    nt: fila.nt,
    po: fila.po,
  };
}

export class PrismaMaterialRepository implements MaterialRepository {
  private readonly prisma: ClientePrisma;

  constructor(prisma: ClientePrisma) {
    this.prisma = prisma;
  }

  async crearVarios(ordenId: string, materiales: readonly NuevoMaterialOrden[]): Promise<readonly MaterialOrden[]> {
    const creados: MaterialOrden[] = [];
    for (const material of materiales) {
      const fila = await this.prisma.materialOrden.create({
        data: {
          ordenId,
          tipo: material.tipo,
          descripcion: material.descripcion,
          cantidad: new Prisma.Decimal(material.cantidad),
          unidad: material.unidad ?? null,
          costoUnitarioCotizado: new Prisma.Decimal(material.costoUnitarioCotizado),
          costoUnitarioReal: material.costoUnitarioReal == null ? null : new Prisma.Decimal(material.costoUnitarioReal),
          nroRemito: material.nroRemito ?? null,
          nroFactura: material.nroFactura ?? null,
          nt: material.nt ?? null,
          po: material.po ?? null,
        },
      });
      creados.push(aMaterial(fila));
    }
    return creados;
  }

  async listarPorOrden(ordenId: string): Promise<readonly MaterialOrden[]> {
    const filas = await this.prisma.materialOrden.findMany({ where: { ordenId }, orderBy: { id: 'asc' } });
    return filas.map(aMaterial);
  }
}
