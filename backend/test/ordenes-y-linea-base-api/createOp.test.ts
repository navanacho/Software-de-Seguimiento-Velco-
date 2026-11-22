import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { conBase, hayDocker } from '../tablero-read-api/ayuda.ts';
import { crearDependencias } from '../../src/shared/dependencias.ts';
import { createOp } from '../../src/features/ordenes/application/createOp.ts';

describe('createOp', () => {
  it.skipIf(!hayDocker())('5.1 crea OP + cliente nuevo + etapas default en transacción', async () => {
    await conBase(async ({ prisma }) => {
      const deps = crearDependencias(prisma);
      const res = await createOp(deps, {
        numeroOp: `OT-CREATE-${randomUUID().slice(0, 8)}`,
        codigoPlano: ' pl-2026-045 ',
        clienteNombre: 'Cliente Nuevo',
        descripcionPieza: 'Pieza',
        fechaEntrega: '2027-04-30',
        montoVendido: '100.00',
        observaciones: null,
        materiales: [],
      });
      expect(res.op.codigoPlano).toBe('PL-2026-045');
      expect(res.etapas).toHaveLength(5);
      expect(res.cliente.nombre).toBe('Cliente Nuevo');
      expect(await prisma.ordenTrabajo.count()).toBe(1);
    });
  }, 180000);

  it.skipIf(!hayDocker())('5.3 TRIANGULA: reutiliza cliente existente y acepta plano null', async () => {
    await conBase(async ({ prisma }) => {
      const deps = crearDependencias(prisma);
      const sufijo = randomUUID().slice(0, 8);
      const existente = await deps.clientes.crear({ nombre: `Cliente Reuse ${sufijo}` });
      const res = await createOp(deps, {
        numeroOp: `OT-REUSE-${sufijo}`,
        codigoPlano: null,
        clienteNombre: `Cliente Reuse ${sufijo}`,
        descripcionPieza: 'Pieza',
        fechaEntrega: '2027-04-30',
        montoVendido: '100.00',
        observaciones: null,
        materiales: [],
      });
      expect(res.cliente.id).toBe(existente.id);
      expect(res.op.codigoPlano).toBeNull();
      expect(await prisma.cliente.count({ where: { nombre: `Cliente Reuse ${sufijo}` } })).toBe(1);
    });
  }, 180000);
});
