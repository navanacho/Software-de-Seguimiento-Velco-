import type { Configuracion } from '@velco/domain';
import type { PrismaClient } from '@prisma/client';
import type { ConfiguracionRepository } from '../application/ports/ConfiguracionRepository.ts';
import { convertirEtapasDefault } from './etapas-default.ts';

export class PrismaConfiguracionRepository implements ConfiguracionRepository {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async obtener(): Promise<Configuracion | null> {
    const fila = await this.prisma.configuracion.findUnique({ where: { id: 1 } });
    if (!fila) return null;
    return {
      id: fila.id,
      valorHoraEstandar: fila.valorHoraEstandar.toFixed(2),
      diasAlertaRiesgo: fila.diasAlertaRiesgo,
      porcentajeAvanceRiesgo: fila.porcentajeAvanceRiesgo,
      etapasDefault: convertirEtapasDefault(fila.etapasDefault),
    };
  }
}
