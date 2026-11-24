import type { Configuracion } from '@velco/domain';

export interface ConfiguracionRepository {
  obtener(): Promise<Configuracion | null>;
  actualizar(configuracion: Configuracion): Promise<Configuracion>;
}
