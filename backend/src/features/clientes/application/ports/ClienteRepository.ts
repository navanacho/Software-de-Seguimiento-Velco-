import type { Cliente, NuevoCliente } from '@velco/domain';

export interface ClienteRepository {
  crear(datos: NuevoCliente): Promise<Cliente>;
  buscarPorNombre(nombre: string): Promise<Cliente | null>;
  buscarPorId(id: string): Promise<Cliente | null>;
}
