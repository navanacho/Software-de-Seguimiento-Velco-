import { PrismaPg } from '@prisma/adapter-pg';
import type { PrismaClient } from '@prisma/client';
import { PrismaClient as ClientePrisma } from '@prisma/client';
import type { ClienteRepository } from '../features/clientes/application/ports/ClienteRepository.ts';
import type { ConfiguracionRepository } from '../features/configuracion/application/ports/ConfiguracionRepository.ts';
import type { EtapaRepository } from '../features/etapas/application/ports/EtapaRepository.ts';
import type { OpRepository } from '../features/ordenes/application/ports/OpRepository.ts';
import { PrismaClienteRepository } from '../features/clientes/prisma/PrismaClienteRepository.ts';
import { PrismaConfiguracionRepository } from '../features/configuracion/prisma/PrismaConfiguracionRepository.ts';
import { PrismaEtapaRepository } from '../features/etapas/prisma/PrismaEtapaRepository.ts';
import { PrismaOpRepository } from '../features/ordenes/prisma/PrismaOpRepository.ts';
import { ZONA_HORARIA_POR_DEFECTO } from './configuracion.ts';
import type { Reloj } from './reloj.ts';
import { RelojSistema } from './reloj.ts';

export { ZONA_HORARIA_POR_DEFECTO };

export interface DependenciasApi {
  readonly ops: OpRepository;
  readonly etapas: EtapaRepository;
  readonly clientes: ClienteRepository;
  readonly configuracion: ConfiguracionRepository;
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
    configuracion: new PrismaConfiguracionRepository(prisma),
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
