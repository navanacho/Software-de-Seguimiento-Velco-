import type { Cliente, NuevoCliente } from '@velco/domain';
import type { Cliente as ClientePrismaModel, Prisma, PrismaClient } from '@prisma/client';
import type { ClienteRepository } from '../application/ports/ClienteRepository.ts';

function aCliente(fila: ClientePrismaModel): Cliente {
  return {
    id: fila.id,
    nombre: fila.nombre,
    createdAt: fila.createdAt.toISOString(),
  };
}

type ClientePrisma = PrismaClient | Prisma.TransactionClient;

export class PrismaClienteRepository implements ClienteRepository {
  private readonly prisma: ClientePrisma;

  constructor(prisma: ClientePrisma) {
    this.prisma = prisma;
  }

  async crear(datos: NuevoCliente): Promise<Cliente> {
    const fila = await this.prisma.cliente.create({ data: { nombre: datos.nombre } });
    return aCliente(fila);
  }

  async buscarPorNombre(nombre: string): Promise<Cliente | null> {
    const fila = await this.prisma.cliente.findUnique({ where: { nombre } });
    return fila ? aCliente(fila) : null;
  }

  async buscarPorId(id: string): Promise<Cliente | null> {
    const fila = await this.prisma.cliente.findUnique({ where: { id } });
    return fila ? aCliente(fila) : null;
  }
}
