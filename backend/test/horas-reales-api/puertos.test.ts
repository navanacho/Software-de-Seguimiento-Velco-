import { describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { conBase, hayDocker } from '../core-order-models/contenedor.ts';
import { crearDependencias } from '../../src/shared/dependencias.ts';

describe('C-08 2.7/2.14 puertos-persistencia-horas', () => {
  it.skipIf(!hayDocker())('2.7 persiste y lee horas como cadena decimal exacta', async () => {
    await conBase(async ({ prisma }) => {
      const deps = crearDependencias(prisma);
      const cliente = await deps.clientes.crear({ nombre: `Cliente Horas ${randomUUID().slice(0, 8)}` });
      const op = await deps.ops.crear({
        numeroOp: `OT-H-${randomUUID().slice(0, 8)}`,
        codigoPlano: null,
        clienteId: cliente.id,
        descripcionPieza: 'Pieza',
        fechaEntrega: '2027-01-01',
        montoVendido: '10.00',
      });
      const creado = await deps.horas.crear({ ordenId: op.id, etapaId: null, operario: 'Ana', fecha: '2026-11-20', horas: '2.50', observacion: null });
      expect(creado.horas).toBe('2.50');
      const listado = await deps.horas.listarPorOrden(op.id);
      expect(listado[0]?.horas).toBe('2.50');
    });
  }, 180_000);

  it.skipIf(!hayDocker())('2.14 TRIANGULATE crear/listar/actualizar/eliminar y round-trip decimal', async () => {
    await conBase(async ({ prisma }) => {
      const deps = crearDependencias(prisma);
      const cliente = await deps.clientes.crear({ nombre: `Cliente Horas ${randomUUID().slice(0, 8)}` });
      const op = await deps.ops.crear({
        numeroOp: `OT-H-${randomUUID().slice(0, 8)}`,
        codigoPlano: null,
        clienteId: cliente.id,
        descripcionPieza: 'Pieza',
        fechaEntrega: '2027-01-01',
        montoVendido: '10.00',
      });
      const creado = await deps.horas.crear({ ordenId: op.id, etapaId: null, operario: 'Ana', fecha: '2026-11-20', horas: '0.10', observacion: 'x' });
      const actualizado = await deps.horas.actualizar(creado.id, { horas: '0.20', observacion: null });
      expect(actualizado?.horas).toBe('0.20');
      expect(actualizado?.observacion).toBeNull();
      expect(await deps.horas.eliminar(creado.id)).toBe(true);
      expect(await deps.horas.buscarPorId(creado.id)).toBeNull();
    });
  }, 180_000);
});
