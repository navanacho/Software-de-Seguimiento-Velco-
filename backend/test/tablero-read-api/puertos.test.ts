import { randomUUID } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { crearDependencias } from '../../src/shared/dependencias.ts';
import { conBase, hayDocker } from './ayuda.ts';

interface Repos {
  readonly ops: ReturnType<typeof crearDependencias>['ops'];
  readonly etapas: ReturnType<typeof crearDependencias>['etapas'];
  readonly clientes: ReturnType<typeof crearDependencias>['clientes'];
}

async function sembrar(prisma: PrismaClient): Promise<{
  repos: Repos;
  clienteId: string;
  ordenId: string;
}> {
  const dependencias = crearDependencias(prisma);
  const sufijo = randomUUID().slice(0, 8);
  const cliente = await dependencias.clientes.crear({ nombre: `Cliente Puertos ${sufijo}` });
  const orden = await dependencias.ops.crear({
    numeroOp: `OT-PUERTO-${sufijo}`,
    clienteId: cliente.id,
    descripcionPieza: 'Pieza de puertos',
    fechaEntrega: '2027-04-30',
    montoVendido: '100.00',
  });
  await dependencias.etapas.crearVarias(orden.id, [
    { nombre: 'Corte', ordenSecuencia: 1, horasVendidas: '1.25' },
    { nombre: 'Soldadura', ordenSecuencia: 2, horasVendidas: '2.50' },
  ]);
  return { repos: dependencias, clienteId: cliente.id, ordenId: orden.id };
}

describe('puertos ampliados del tablero contra PostgreSQL real', () => {
  it.skipIf(!hayDocker())(
    'D2 RN-GLOBAL-02 listarConEtapas devuelve orden, etapas ordenadas y clienteNombre en una sola lectura',
    async () => {
      await conBase(async ({ prisma }) => {
        const { repos, clienteId, ordenId } = await sembrar(prisma);
        const filas = await repos.ops.listarConEtapas();
        const fila = filas.find((item) => item.orden.id === ordenId);
        expect(fila).toBeDefined();
        if (!fila) throw new Error('la OP sembrada no apareció en listarConEtapas');
        expect(fila.clienteNombre).toMatch(/^Cliente Puertos /);
        expect(fila.etapas.map((etapa) => etapa.nombre)).toEqual(['Corte', 'Soldadura']);
        expect(fila.etapas.map((etapa) => etapa.ordenSecuencia)).toEqual([1, 2]);
        expect(fila.etapas[0]?.horasVendidas).toBe('1.25');
        expect(fila.orden.clienteId).toBe(clienteId);
        expect(fila.orden.montoVendido).toBe('100.00');
      });
    },
    180_000,
  );

  it.skipIf(!hayDocker())('D2 TRIANGULA: una OP sin etapas se lista con etapas vacías', async () => {
    await conBase(async ({ prisma }) => {
      const dependencias = crearDependencias(prisma);
      const sufijo = randomUUID().slice(0, 8);
      const cliente = await dependencias.clientes.crear({ nombre: `Cliente Sin Etapas ${sufijo}` });
      const orden = await dependencias.ops.crear({
        numeroOp: `OT-SIN-ETAPAS-${sufijo}`,
        clienteId: cliente.id,
        descripcionPieza: 'Pieza sin etapas',
        fechaEntrega: '2027-05-30',
        montoVendido: '0.00',
      });
      const filas = await dependencias.ops.listarConEtapas();
      const fila = filas.find((item) => item.orden.id === orden.id);
      if (!fila) throw new Error('la OP sin etapas no apareció en el listado');
      expect(fila.etapas).toEqual([]);
      expect(fila.clienteNombre).toBe(`Cliente Sin Etapas ${sufijo}`);
    });
  }, 180_000);

  it.skipIf(!hayDocker())('D2 TRIANGULA: dos OPs del mismo cliente conservan cada una sus etapas', async () => {
    await conBase(async ({ prisma }) => {
      const dependencias = crearDependencias(prisma);
      const sufijo = randomUUID().slice(0, 8);
      const cliente = await dependencias.clientes.crear({ nombre: `Cliente Compartido ${sufijo}` });
      const ordenA = await dependencias.ops.crear({
        numeroOp: `OT-COMPARTIDA-A-${sufijo}`,
        clienteId: cliente.id,
        descripcionPieza: 'Pieza A',
        fechaEntrega: '2027-06-01',
        montoVendido: '10.00',
      });
      const ordenB = await dependencias.ops.crear({
        numeroOp: `OT-COMPARTIDA-B-${sufijo}`,
        clienteId: cliente.id,
        descripcionPieza: 'Pieza B',
        fechaEntrega: '2027-06-02',
        montoVendido: '20.00',
      });
      await dependencias.etapas.crearVarias(ordenA.id, [{ nombre: 'Corte', ordenSecuencia: 1 }]);
      await dependencias.etapas.crearVarias(ordenB.id, [
        { nombre: 'Pintura', ordenSecuencia: 2 },
        { nombre: 'Lijado', ordenSecuencia: 1 },
      ]);
      const filas = await dependencias.ops.listarConEtapas();
      const filaA = filas.find((item) => item.orden.id === ordenA.id);
      const filaB = filas.find((item) => item.orden.id === ordenB.id);
      if (!filaA || !filaB) throw new Error('faltó alguna de las dos OPs del mismo cliente');
      expect(filaA.clienteNombre).toBe(`Cliente Compartido ${sufijo}`);
      expect(filaB.clienteNombre).toBe(`Cliente Compartido ${sufijo}`);
      expect(filaA.etapas.map((etapa) => etapa.nombre)).toEqual(['Corte']);
      expect(filaB.etapas.map((etapa) => etapa.nombre)).toEqual(['Lijado', 'Pintura']);
    });
  }, 180_000);

  it.skipIf(!hayDocker())('D4 RN-AVANCE-01 buscarPorId distingue etapa existente de UUID ajeno', async () => {
    await conBase(async ({ prisma }) => {
      const { repos, ordenId } = await sembrar(prisma);
      const etapas = await repos.etapas.listarPorOrden(ordenId);
      const etapa = etapas[0];
      if (!etapa) throw new Error('la siembra no generó etapas');
      expect(await repos.etapas.buscarPorId(etapa.id)).toEqual(etapa);
      expect(await repos.etapas.buscarPorId(randomUUID())).toBeNull();
    });
  }, 180_000);

  it.skipIf(!hayDocker())('D4 RN-AVANCE-01 actualizarCompletada alterna true y false', async () => {
    await conBase(async ({ prisma }) => {
      const { repos, ordenId } = await sembrar(prisma);
      const etapas = await repos.etapas.listarPorOrden(ordenId);
      const etapa = etapas[0];
      if (!etapa) throw new Error('la siembra no generó etapas');
      const marcada = await repos.etapas.actualizarCompletada(etapa.id, true);
      expect(marcada?.completada).toBe(true);
      const desmarcada = await repos.etapas.actualizarCompletada(etapa.id, false);
      expect(desmarcada?.completada).toBe(false);
      expect((await repos.etapas.listarPorOrden(ordenId))[0]?.completada).toBe(false);
    });
  }, 180_000);

  it.skipIf(!hayDocker())('R3 TRIANGULA: actualizarCompletada no toca horasVendidas, nombre ni ordenSecuencia', async () => {
    await conBase(async ({ prisma }) => {
      const { repos, ordenId } = await sembrar(prisma);
      const etapa = (await repos.etapas.listarPorOrden(ordenId))[0];
      if (!etapa) throw new Error('la siembra no generó etapas');
      await repos.etapas.actualizarCompletada(etapa.id, true);
      const despues = await repos.etapas.buscarPorId(etapa.id);
      expect(despues).toEqual({
        ...etapa,
        completada: true,
      });
      expect(despues?.horasVendidas).toBe(etapa.horasVendidas);
      expect(despues?.nombre).toBe(etapa.nombre);
      expect(despues?.ordenSecuencia).toBe(etapa.ordenSecuencia);
      expect(await repos.etapas.buscarPorId(randomUUID())).toBeNull();
    });
  }, 180_000);
});
