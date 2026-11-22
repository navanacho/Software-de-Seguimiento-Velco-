import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { conBase, hayDocker } from '../tablero-read-api/ayuda.ts';
import { crearDependencias } from '../../src/shared/dependencias.ts';

describe('UnidadTrabajoOps', () => {
  it('4.10 puerto existe y caso de uso no importa Prisma', () => {
    const puerto = readFileSync(new URL('../../src/features/ordenes/application/ports/UnidadTrabajoOps.ts', import.meta.url), 'utf8');
    expect(puerto).toContain('UnidadTrabajoOps');
    expect(puerto).not.toContain('PrismaClient');
    expect(puerto).not.toContain('@prisma/client');
  });

  it.skipIf(!hayDocker())('4.12 rollback completo ante fallo', async () => {
    await conBase(async ({ prisma }) => {
      const deps = crearDependencias(prisma);
      await expect(
        deps.unidadTrabajoOps.ejecutar(async (repos) => {
          const cliente = await repos.clientes.crear({ nombre: 'Cliente Tx' });
          await repos.ops.crear({
            numeroOp: 'OT-TX-1',
            clienteId: cliente.id,
            descripcionPieza: 'Pieza',
            fechaEntrega: '2027-01-01',
            montoVendido: '1.00',
          });
          throw new Error('boom');
        }),
      ).rejects.toThrow('boom');
      expect(await prisma.cliente.count({ where: { nombre: 'Cliente Tx' } })).toBe(0);
      expect(await prisma.ordenTrabajo.count({ where: { numeroOp: 'OT-TX-1' } })).toBe(0);
    });
  }, 180000);
});
