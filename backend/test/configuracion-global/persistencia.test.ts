import { describe, expect, it } from 'vitest';
import { PrismaConfiguracionRepository } from '../../src/features/configuracion/prisma/PrismaConfiguracionRepository.ts';
import { conBase, hayDocker } from '../core-order-models/contenedor.ts';

describe.skipIf(!hayDocker())('persistencia de configuración con PostgreSQL 18.7', () => {
  it('obtener devuelve la fila sembrada con id 1 y decimal exacto', async () => {
    await conBase(async ({ prisma }) => {
      const repositorio = new PrismaConfiguracionRepository(prisma);
      const configuracion = await repositorio.obtener();
      expect(configuracion).toMatchObject({
        id: 1,
        valorHoraEstandar: '0.00',
        diasAlertaRiesgo: 3,
        porcentajeAvanceRiesgo: 80,
        etapasDefault: ['Corte', 'Soldadura', 'Mecanizado', 'Pintura', 'Entrega'],
      });
    });
  });

  it('actualizar persiste el decimal exacto y la relectura devuelve los mismos valores', async () => {
    await conBase(async ({ prisma }) => {
      const repositorio = new PrismaConfiguracionRepository(prisma);
      const escrita = await repositorio.actualizar({
        id: 1,
        valorHoraEstandar: '1250.50',
        diasAlertaRiesgo: 5,
        porcentajeAvanceRiesgo: 60,
        etapasDefault: ['Corte', 'Plegado', 'Entrega'],
      });
      expect(escrita.valorHoraEstandar).toBe('1250.50');
      const fila = await prisma.configuracion.findUniqueOrThrow({ where: { id: 1 } });
      expect(fila.valorHoraEstandar.toFixed(2)).toBe('1250.50');
      expect(await repositorio.obtener()).toEqual({
        id: 1,
        valorHoraEstandar: '1250.50',
        diasAlertaRiesgo: 5,
        porcentajeAvanceRiesgo: 60,
        etapasDefault: ['Corte', 'Plegado', 'Entrega'],
      });
    });
  });

  it('REFACTOR: varias actualizaciones conservan una única fila con id 1', async () => {
    await conBase(async ({ prisma }) => {
      const repositorio = new PrismaConfiguracionRepository(prisma);
      for (const valorHoraEstandar of ['10.00', '20.00', '30.00']) {
        await repositorio.actualizar({
          id: 1,
          valorHoraEstandar,
          diasAlertaRiesgo: 1,
          porcentajeAvanceRiesgo: 50,
          etapasDefault: ['Corte', 'Entrega'],
        });
      }
      expect(await prisma.configuracion.count()).toBe(1);
      expect((await repositorio.obtener())?.valorHoraEstandar).toBe('30.00');
    });
  });
});
