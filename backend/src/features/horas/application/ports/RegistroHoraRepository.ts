import type { RegistroHora, NuevoRegistroHora } from '@velco/domain';

export interface RegistroHoraRepository {
  crear(datos: NuevoRegistroHora): Promise<RegistroHora>;
  listarPorOrden(ordenId: string): Promise<readonly RegistroHora[]>;
  listarPorOrdenes(ordenIds: readonly string[]): Promise<readonly RegistroHora[]>;
  buscarPorId(id: string): Promise<RegistroHora | null>;
  actualizar(id: string, datos: Partial<Omit<NuevoRegistroHora, 'ordenId'>>): Promise<RegistroHora | null>;
  eliminar(id: string): Promise<boolean>;
}
