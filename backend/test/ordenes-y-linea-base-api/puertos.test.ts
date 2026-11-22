import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { conBase, hayDocker } from '../tablero-read-api/ayuda.ts';
import { crearDependencias } from '../../src/shared/dependencias.ts';

describe('C-06 puertos y persistencia', () => {
  it.skipIf(!hayDocker())('4.1 buscarPorCodigoPlano devuelve OP por plano normalizado y null si no existe', async () => {
    await conBase(async ({ prisma }) => {
      const deps = crearDependencias(prisma);
      const sufijo = randomUUID().slice(0, 8);
      const cliente = await deps.clientes.crear({ nombre: `Cliente Plano ${sufijo}` });
      const orden = await deps.ops.crear({
        numeroOp: `OT-PLANO-${sufijo}`,
        codigoPlano: 'PL-2026-045',
        clienteId: cliente.id,
        descripcionPieza: 'Pieza plano',
        fechaEntrega: '2027-04-30',
        montoVendido: '100.00',
      });
      expect(await deps.ops.buscarPorCodigoPlano('PL-2026-045')).toMatchObject({ id: orden.id });
      expect(await deps.ops.buscarPorCodigoPlano('PL-INEXISTENTE')).toBeNull();
    });
  }, 180_000);

  it.skipIf(!hayDocker())('4.1 TRIANGULA: buscarPorCodigoPlano excluye la OP editada', async () => {
    await conBase(async ({ prisma }) => {
      const deps = crearDependencias(prisma);
      const sufijo = randomUUID().slice(0, 8);
      const cliente = await deps.clientes.crear({ nombre: `Cliente Plano Ex ${sufijo}` });
      const orden = await deps.ops.crear({
        numeroOp: `OT-PLANO-EX-${sufijo}`,
        codigoPlano: 'PL-2026-099',
        clienteId: cliente.id,
        descripcionPieza: 'Pieza plano',
        fechaEntrega: '2027-04-30',
        montoVendido: '100.00',
      });
      expect(await deps.ops.buscarPorCodigoPlano('PL-2026-099', orden.id)).toBeNull();
      expect(await deps.ops.buscarPorCodigoPlano('PL-2026-099', randomUUID())).toMatchObject({ id: orden.id });
    });
  }, 180_000);
});
