import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { conBase, hayDocker } from '../tablero-read-api/ayuda.ts';
import { crearDependencias } from '../../src/shared/dependencias.ts';
import { createOp } from '../../src/features/ordenes/application/createOp.ts';

describe('createOp materiales tx', () => {
  it.skipIf(!hayDocker())('5.4 revierte todo si un material es inválido', async () => {
    await conBase(async ({ prisma }) => {
      const deps = crearDependencias(prisma);
      const numeroOp = `OT-MAT-${randomUUID().slice(0, 8)}`;
      await expect(createOp(deps, {
        numeroOp,
        codigoPlano: null,
        clienteNombre: 'Cliente Mat',
        descripcionPieza: 'Pieza',
        fechaEntrega: '2027-04-30',
        montoVendido: '100.00',
        observaciones: null,
        materiales: [{ tipo: 'OTROS', descripcion: 'X', cantidad: 1, costoUnitarioCotizado: '10.00' }],
      })).rejects.toThrow(/validation_error/);
      expect(await prisma.ordenTrabajo.count({ where: { numeroOp } })).toBe(0);
      expect(await prisma.etapaOrden.count()).toBe(0);
      expect(await prisma.materialOrden.count()).toBe(0);
      expect(await prisma.cliente.count()).toBe(0);
    });
  }, 180000);

  it.skipIf(!hayDocker())('5.6 TRIANGULA: error de forma 422 no llega a PostgreSQL', async () => {
    await conBase(async ({ prisma }) => {
      const deps = crearDependencias(prisma);
      await expect(createOp(deps, {
        numeroOp: `OT-MAT2-${randomUUID().slice(0, 8)}`,
        codigoPlano: null,
        clienteNombre: 'Cliente Mat2',
        descripcionPieza: 'Pieza',
        fechaEntrega: '2027-04-30',
        montoVendido: '100.00',
        observaciones: null,
        materiales: [{ tipo: 'MP', descripcion: '', cantidad: 1, costoUnitarioCotizado: '10.00' }],
      })).rejects.toThrow(/validation_error/);
      expect(await prisma.ordenTrabajo.count()).toBe(0);
      expect(await prisma.materialOrden.count()).toBe(0);
    });
  }, 180000);
});
