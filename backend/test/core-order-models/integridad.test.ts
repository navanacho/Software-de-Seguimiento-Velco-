import type { PrismaClient } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { PrismaConfiguracionRepository } from '../../src/features/configuracion/prisma/PrismaConfiguracionRepository.ts';
import { PrismaClienteRepository } from '../../src/features/clientes/prisma/PrismaClienteRepository.ts';
import { PrismaEtapaRepository } from '../../src/features/etapas/prisma/PrismaEtapaRepository.ts';
import { PrismaOpRepository } from '../../src/features/ordenes/prisma/PrismaOpRepository.ts';
import { conBase, hayDocker } from './contenedor.ts';

type Repositorios = ReturnType<typeof crearRepositorios>;

function crearRepositorios(prisma: PrismaClient) {
  return {
    clientes: new PrismaClienteRepository(prisma),
    ops: new PrismaOpRepository(prisma),
    etapas: new PrismaEtapaRepository(prisma),
    configuracion: new PrismaConfiguracionRepository(prisma),
  };
}

async function insertarCliente(repos: Repositorios, nombre: string): Promise<string> {
  const cliente = await repos.clientes.crear({ nombre });
  return cliente.id;
}

async function insertarOp(repos: Repositorios, numeroOp: string, clienteId: string): Promise<string> {
  const orden = await repos.ops.crear({
    numeroOp,
    clienteId,
    descripcionPieza: 'Pieza de prueba',
    fechaEntrega: '2027-01-31',
    montoVendido: '1250.50',
  });
  expect(orden.montoVendido).toBe('1250.50');
  return orden.id;
}

async function insertarEtapa(
  repos: Repositorios,
  ordenId: string,
  nombre: string,
  ordenSecuencia: number,
): Promise<string> {
  const creadas = await repos.etapas.crearVarias(ordenId, [{ nombre, ordenSecuencia }]);
  const etapa = creadas[0];
  if (!etapa) throw new Error('No se pudo insertar la etapa de prueba');
  expect(etapa.horasVendidas).toBe('0.00');
  return etapa.id;
}

async function mensajeDeRechazo(accion: () => Promise<unknown>): Promise<string> {
  try {
    await accion();
  } catch (error: unknown) {
    return error instanceof Error ? error.message : String(error);
  }
  throw new Error('La base de datos debía rechazar la operación');
}

describe('integridad del modelo relacional de C-02', () => {
  it.skipIf(!hayDocker())('RN-OP-01 rechaza un numero_op duplicado', async () => {
    await conBase(async ({ prisma }) => {
      const repos = crearRepositorios(prisma);
      const cliente = await insertarCliente(repos, 'Cliente OP');
      await insertarOp(repos, 'OT-1001', cliente);
      const mensaje = await mensajeDeRechazo(() => insertarOp(repos, 'OT-1001', cliente));
      expect(mensaje).toMatch(/duplicate key|unique constraint|ya existe/i);
    });
  }, 180_000);

  it.skipIf(!hayDocker())('DD-06 rechaza un nombre de cliente duplicado', async () => {
    await conBase(async ({ prisma }) => {
      const repos = crearRepositorios(prisma);
      await insertarCliente(repos, 'Cliente Unico');
      const mensaje = await mensajeDeRechazo(() => insertarCliente(repos, 'Cliente Unico'));
      expect(mensaje).toMatch(/duplicate key|unique constraint/i);
    });
  }, 180_000);

  it.skipIf(!hayDocker())('CASCADE elimina las etapas al borrar la OP', async () => {
    await conBase(async ({ prisma }) => {
      const repos = crearRepositorios(prisma);
      const cliente = await insertarCliente(repos, 'Cliente CASCADE');
      const orden = await insertarOp(repos, 'OT-1002', cliente);
      await insertarEtapa(repos, orden, 'Corte', 1);
      await prisma.$executeRawUnsafe('DELETE FROM ordenes_trabajo WHERE id = $1', orden);
      expect(await repos.etapas.listarPorOrden(orden)).toEqual([]);
    });
  }, 180_000);

  it.skipIf(!hayDocker())('RESTRICT rechaza borrar un cliente con OPs', async () => {
    await conBase(async ({ prisma }) => {
      const repos = crearRepositorios(prisma);
      const cliente = await insertarCliente(repos, 'Cliente RESTRICT');
      await insertarOp(repos, 'OT-1003', cliente);
      const mensaje = await mensajeDeRechazo(() =>
        prisma.$executeRawUnsafe('DELETE FROM clientes WHERE id = $1', cliente),
      );
      expect(mensaje).toMatch(/foreign key constraint|restrict/i);
    });
  }, 180_000);

  it.skipIf(!hayDocker())('RN-CONFIG-01/03 mantiene una sola fila con los valores del seed', async () => {
    await conBase(async ({ prisma }) => {
      const repos = crearRepositorios(prisma);
      const configuracion = await repos.configuracion.obtener();
      expect(configuracion).toMatchObject({
        id: 1,
        diasAlertaRiesgo: 3,
        porcentajeAvanceRiesgo: 80,
        etapasDefault: ['Corte', 'Soldadura', 'Mecanizado', 'Pintura', 'Entrega'],
      });
      expect(configuracion?.valorHoraEstandar).toBe('0.00');
      const mensaje = await mensajeDeRechazo(() =>
        prisma.$executeRawUnsafe(
          `INSERT INTO configuracion (id, valor_hora_estandar, dias_alerta_riesgo, porcentaje_avance_riesgo, etapas_default)
           VALUES (1, 0, 3, 80, '[]'::jsonb)`,
        ),
      );
      expect(mensaje).toMatch(/duplicate key|unique constraint|check constraint/i);
    });
  }, 180_000);

  it.skipIf(!hayDocker())('RN-OP-01 acepta números distintos de clientes distintos', async () => {
    await conBase(async ({ prisma }) => {
      const repos = crearRepositorios(prisma);
      const clienteA = await insertarCliente(repos, 'Cliente OP A');
      const clienteB = await insertarCliente(repos, 'Cliente OP B');
      await insertarOp(repos, 'OT-2001', clienteA);
      await insertarOp(repos, 'OT-2002', clienteB);
      expect((await repos.ops.buscarPorNumeroOp('OT-2001'))?.numeroOp).toBe('OT-2001');
      expect((await repos.ops.buscarPorNumeroOp('OT-2002'))?.numeroOp).toBe('OT-2002');
    });
  }, 180_000);

  it.skipIf(!hayDocker())('DD-06 acepta dos nombres de cliente distintos', async () => {
    await conBase(async ({ prisma }) => {
      const repos = crearRepositorios(prisma);
      await insertarCliente(repos, 'Nombre Uno');
      await insertarCliente(repos, 'Nombre Dos');
      expect((await repos.clientes.buscarPorNombre('Nombre Uno'))?.nombre).toBe('Nombre Uno');
      expect((await repos.clientes.buscarPorNombre('Nombre Dos'))?.nombre).toBe('Nombre Dos');
    });
  }, 180_000);

  it.skipIf(!hayDocker())('CASCADE no toca las etapas de otra OP', async () => {
    await conBase(async ({ prisma }) => {
      const repos = crearRepositorios(prisma);
      const cliente = await insertarCliente(repos, 'Cliente CASCADE Dos');
      const ordenA = await insertarOp(repos, 'OT-3001', cliente);
      const ordenB = await insertarOp(repos, 'OT-3002', cliente);
      const etapaA = await insertarEtapa(repos, ordenA, 'Corte', 1);
      const etapaB = await insertarEtapa(repos, ordenB, 'Pintura', 1);
      await prisma.$executeRawUnsafe('DELETE FROM ordenes_trabajo WHERE id = $1', ordenA);
      expect(await repos.etapas.listarPorOrden(ordenA)).toEqual([]);
      expect((await repos.etapas.listarPorOrden(ordenB)).map((etapa) => etapa.id)).toEqual([etapaB]);
      expect((await repos.etapas.listarPorOrden(ordenB)).map((etapa) => etapa.id)).not.toContain(etapaA);
    });
  }, 180_000);

  it.skipIf(!hayDocker())('RESTRICT permite borrar un cliente sin OPs', async () => {
    await conBase(async ({ prisma }) => {
      const repos = crearRepositorios(prisma);
      const cliente = await insertarCliente(repos, 'Cliente Sin OP');
      await prisma.$executeRawUnsafe('DELETE FROM clientes WHERE id = $1', cliente);
      expect(await repos.clientes.buscarPorId(cliente)).toBeNull();
    });
  }, 180_000);

  it.skipIf(!hayDocker())('RN-CONFIG-03 rechaza una segunda fila con id distinto de 1', async () => {
    await conBase(async ({ prisma }) => {
      const mensaje = await mensajeDeRechazo(() =>
        prisma.$executeRawUnsafe(
          `INSERT INTO configuracion (id, valor_hora_estandar, dias_alerta_riesgo, porcentaje_avance_riesgo, etapas_default)
           VALUES (2, 0, 3, 80, '[]'::jsonb)`,
        ),
      );
      expect(mensaje).toMatch(/check constraint|configuracion_id_check/i);
    });
  }, 180_000);
});
