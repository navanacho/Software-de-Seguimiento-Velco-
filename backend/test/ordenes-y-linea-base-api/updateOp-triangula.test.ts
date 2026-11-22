import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { conBase, hayDocker } from '../tablero-read-api/ayuda.ts';
import { crearDependencias } from '../../src/shared/dependencias.ts';
import { createOp } from '../../src/features/ordenes/application/createOp.ts';
import { updateOp } from '../../src/features/ordenes/application/updateOp.ts';
import { CodigoPlanoDuplicadoError, RecursoNoEncontradoError } from '../../src/shared/errores.ts';

describe('updateOp triangula', () => {
  it.skipIf(!hayDocker())('5.9 conserva mismo plano, 409 plano ajeno con opExistente y 404', async () => {
    await conBase(async ({ prisma }) => {
      const deps = crearDependencias(prisma);
      const s = randomUUID().slice(0, 8);
      const a = await createOp(deps, { numeroOp: `OT-A-${s}`, codigoPlano: 'PL-A', clienteNombre: 'C', descripcionPieza: 'P', fechaEntrega: '2027-01-01', montoVendido: '10.00', observaciones: null, materiales: [] });
      const b = await createOp(deps, { numeroOp: `OT-B-${s}`, codigoPlano: 'PL-B', clienteNombre: 'C', descripcionPieza: 'P', fechaEntrega: '2027-01-01', montoVendido: '10.00', observaciones: null, materiales: [] });
      const mismo = await updateOp(deps, a.op.id, { numeroOp: a.op.numeroOp, codigoPlano: ' pl-a ', clienteNombre: 'C', descripcionPieza: 'P3', fechaEntrega: '2027-03-01', montoVendido: '30.00', observaciones: null });
      expect(mismo.codigoPlano).toBe('PL-A');
      await expect(updateOp(deps, a.op.id, { numeroOp: a.op.numeroOp, codigoPlano: 'PL-B', clienteNombre: 'C', descripcionPieza: 'P', fechaEntrega: '2027-01-01', montoVendido: '10.00', observaciones: null })).rejects.toBeInstanceOf(CodigoPlanoDuplicadoError);
      await expect(updateOp(deps, randomUUID(), { numeroOp: 'X', codigoPlano: null, clienteNombre: 'C', descripcionPieza: 'P', fechaEntrega: '2027-01-01', montoVendido: '10.00', observaciones: null })).rejects.toBeInstanceOf(RecursoNoEncontradoError);
      expect(b.op.id).toBeTruthy();
    });
  }, 180000);
});
