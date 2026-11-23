import { PrismaPg } from '@prisma/adapter-pg';
import type { PrismaClient } from '@prisma/client';
import { PrismaClient as ClientePrisma } from '@prisma/client';
import type { ClienteRepository } from '../features/clientes/application/ports/ClienteRepository.ts';
import type { ConfiguracionRepository } from '../features/configuracion/application/ports/ConfiguracionRepository.ts';
import type { EtapaRepository } from '../features/etapas/application/ports/EtapaRepository.ts';
import type { OpRepository } from '../features/ordenes/application/ports/OpRepository.ts';
import type { UnidadTrabajoOps } from '../features/ordenes/application/ports/UnidadTrabajoOps.ts';
import type { MaterialRepository } from '../features/materiales/application/ports/MaterialRepository.ts';
import type { RegistroHoraRepository } from '../features/horas/application/ports/RegistroHoraRepository.ts';
import type { UnidadTrabajoHoras } from '../features/horas/application/ports/UnidadTrabajoHoras.ts';
import { PrismaClienteRepository } from '../features/clientes/prisma/PrismaClienteRepository.ts';
import { PrismaConfiguracionRepository } from '../features/configuracion/prisma/PrismaConfiguracionRepository.ts';
import { PrismaEtapaRepository } from '../features/etapas/prisma/PrismaEtapaRepository.ts';
import { PrismaOpRepository } from '../features/ordenes/prisma/PrismaOpRepository.ts';
import { PrismaUnidadTrabajoOps } from '../features/ordenes/prisma/PrismaUnidadTrabajoOps.ts';
import { PrismaMaterialRepository } from '../features/materiales/prisma/PrismaMaterialRepository.ts';
import { PrismaRegistroHoraRepository } from '../features/horas/prisma/PrismaRegistroHoraRepository.ts';
import { PrismaUnidadTrabajoHoras } from '../features/horas/prisma/PrismaUnidadTrabajoHoras.ts';
import { ZONA_HORARIA_POR_DEFECTO } from './configuracion.ts';
import type { Reloj } from './reloj.ts';
import { RelojSistema } from './reloj.ts';

export { ZONA_HORARIA_POR_DEFECTO };

export interface DependenciasApi {
  readonly ops: OpRepository;
  readonly etapas: EtapaRepository;
  readonly clientes: ClienteRepository;
  readonly materiales: MaterialRepository;
  readonly horas: RegistroHoraRepository;
  readonly configuracion: ConfiguracionRepository;
  readonly unidadTrabajoOps: UnidadTrabajoOps;
  readonly unidadTrabajoHoras: UnidadTrabajoHoras;
  readonly reloj: Reloj;
  readonly zonaHoraria: string;
}

export function crearDependencias(
  prisma: PrismaClient,
  zonaHoraria: string = ZONA_HORARIA_POR_DEFECTO,
): DependenciasApi {
  return {
    ops: new PrismaOpRepository(prisma),
    etapas: new PrismaEtapaRepository(prisma),
    clientes: new PrismaClienteRepository(prisma),
    materiales: new PrismaMaterialRepository(prisma),
    horas: new PrismaRegistroHoraRepository(prisma),
    configuracion: new PrismaConfiguracionRepository(prisma),
    unidadTrabajoOps: new PrismaUnidadTrabajoOps(prisma),
    unidadTrabajoHoras: new PrismaUnidadTrabajoHoras(prisma),
    reloj: new RelojSistema(),
    zonaHoraria,
  };
}

export function crearDependenciasProduccion(
  zonaHoraria: string = ZONA_HORARIA_POR_DEFECTO,
): DependenciasApi {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' });
  return crearDependencias(new ClientePrisma({ adapter }), zonaHoraria);
}
