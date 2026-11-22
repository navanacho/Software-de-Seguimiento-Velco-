import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { conBase, hayDocker } from '../tablero-read-api/ayuda.ts';
import { crearDependencias } from '../../src/shared/dependencias.ts';
import { createOp } from '../../src/features/ordenes/application/createOp.ts';
import { updateOp } from '../../src/features/ordenes/application/updateOp.ts';
import { NumeroOpDuplicadoError } from '../../src/shared/errores.ts';

describe('updateOp', () => {
  it.skipIf(!hayDocker())('5.7 actualiza cabecera/plano y da 409 numero_op_duplicado sin opExistente', async () => {
    await conBase(async ({ prisma }) => {
      const deps = crearDependencias(prisma);
      const s = randomUUID().slice(0, 8);
      const a = await createOp(deps, { numeroOp: `OT-A-${s}`, codigoPlano: null, clienteNombre: 'C', descripcionPieza: 'P', fechaEntrega: '2027-01-01', montoVendido: '10.00', observaciones: null, materiales: [] });
      await createOp(deps, { numeroOp: `OT-B-${s}`, codigoPlano: null, clienteNombre: 'C', descripcionPieza: 'P', fechaEntrega: '2027-01-01', montoVendido: '10.00', observaciones: null, materiales: [] });
      const upd = await updateOp(deps, a.op.id, { numeroOp: a.op.numeroOp, codigoPlano: 'pl-x', clienteNombre: 'C', descripcionPieza: 'P2', fechaEntrega: '2027-02-01', montoVendido: '20.00', observaciones: null });
      expect(upd.codigoPlano).toBe('PL-X');
      await expect(updateOp(deps, a.op.id, { numeroOp: `OT-B-${s}`, codigoPlano: null, clienteNombre: 'C', descripcionPieza: 'P', fechaEntrega: '2027-01-01', montoVendido: '10.00', observaciones: null })).rejects.toBeInstanceOf(NumeroOpDuplicadoError);
      try { await updateOp(deps, a.op.id, { numeroOp: `OT-B-${s}`, codigoPlano: null, clienteNombre: 'C', descripcionPieza: 'P', fechaEntrega: '2027-01-01', montoVendido: '10.00', observaciones: null }); } catch (e) {
        expect(e).toMatchObject({ body: { error: 'numero_op_duplicado', numeroOp: `OT-B-${s}` } });
        expect(e).not.toHaveProperty('body.opExistente');
      }
    });
  }, 180000);
});
