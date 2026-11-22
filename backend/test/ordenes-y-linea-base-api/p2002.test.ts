import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { conBase, hayDocker } from '../tablero-read-api/ayuda.ts';
import { crearDependencias } from '../../src/shared/dependencias.ts';
import { NumeroOpDuplicadoError } from '../../src/shared/errores.ts';

describe('P2002 mapping C-06', () => {
  it.skipIf(!hayDocker())('4.2 traduce P2002 de codigo_plano a CodigoPlanoDuplicadoError con opExistente', async () => {
    await conBase(async ({ prisma }) => {
      const deps = crearDependencias(prisma);
      const sufijo = randomUUID().slice(0, 8);
      const cliente = await deps.clientes.crear({ nombre: `Cliente P2002 ${sufijo}` });
      await deps.ops.crear({
        numeroOp: `OT-P2002-A-${sufijo}`,
        codigoPlano: 'PL-2026-045',
        clienteId: cliente.id,
        descripcionPieza: 'A',
        fechaEntrega: '2027-04-30',
        montoVendido: '1.00',
      });
      await expect(
        deps.ops.crear({
          numeroOp: `OT-P2002-B-${sufijo}`,
          codigoPlano: 'PL-2026-045',
          clienteId: cliente.id,
          descripcionPieza: 'B',
          fechaEntrega: '2027-04-30',
          montoVendido: '1.00',
        }),
      ).rejects.toMatchObject({
        name: 'CodigoPlanoDuplicadoError',
        body: {
          error: 'codigo_plano_duplicado',
          codigoPlano: 'PL-2026-045',
          opExistente: { numeroOp: `OT-P2002-A-${sufijo}` },
        },
      });
    });
  }, 180_000);

  it.skipIf(!hayDocker())('4.2 TRIANGULA: traduce P2002 de numero_op a NumeroOpDuplicadoError sin opExistente', async () => {
    await conBase(async ({ prisma }) => {
      const deps = crearDependencias(prisma);
      const sufijo = randomUUID().slice(0, 8);
      const cliente = await deps.clientes.crear({ nombre: `Cliente P2002N ${sufijo}` });
      await deps.ops.crear({
        numeroOp: `OT-P2002-DUP-${sufijo}`,
        clienteId: cliente.id,
        descripcionPieza: 'A',
        fechaEntrega: '2027-04-30',
        montoVendido: '1.00',
      });
      const err = await deps.ops
        .crear({
          numeroOp: `OT-P2002-DUP-${sufijo}`,
          clienteId: cliente.id,
          descripcionPieza: 'B',
          fechaEntrega: '2027-04-30',
          montoVendido: '1.00',
        })
        .catch((e: unknown) => e);
      expect(err).toMatchObject({
        name: 'NumeroOpDuplicadoError',
        body: { error: 'numero_op_duplicado', numeroOp: `OT-P2002-DUP-${sufijo}` },
      });
      expect((err as NumeroOpDuplicadoError).body).not.toHaveProperty('opExistente');
    });
  }, 180_000);
});
