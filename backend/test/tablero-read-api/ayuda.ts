import type { PrismaClient } from '@prisma/client';
import { buildApp } from '../../src/features/salud/http/app.ts';
import type { ConfiguracionServidor } from '../../src/shared/configuracion.ts';
import type { DependenciasApi } from '../../src/shared/dependencias.ts';
import { crearDependencias } from '../../src/shared/dependencias.ts';
import { conBase, hayDocker } from '../core-order-models/contenedor.ts';

export { conBase, hayDocker };

export const ZONA_PRUEBA = 'America/Argentina/Mendoza';

export interface ContextoAppReal {
  readonly app: Awaited<ReturnType<typeof buildApp>>;
  readonly prisma: PrismaClient;
  readonly dependencias: DependenciasApi;
}

export function configuracionBase(): ConfiguracionServidor {
  return {
    puerto: 3001,
    origenCors: 'http://localhost:5173',
    baseUncExcel: '',
    zonaHoraria: ZONA_PRUEBA,
  };
}

export async function conAppReal<T>(
  accion: (contexto: ContextoAppReal) => Promise<T>,
): Promise<T> {
  return conBase(async ({ prisma }) => {
    const dependencias = crearDependencias(prisma, ZONA_PRUEBA);
    const app = await buildApp(configuracionBase(), dependencias);
    try {
      return await accion({ app, prisma, dependencias });
    } finally {
      await app.close();
    }
  });
}
