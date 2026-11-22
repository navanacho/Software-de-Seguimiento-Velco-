import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { conBase, hayDocker } from '../tablero-read-api/ayuda.ts';
import { crearDependencias } from '../../src/shared/dependencias.ts';
import { createOp } from '../../src/features/ordenes/application/createOp.ts';
import { gestionarEtapas } from '../../src/features/etapas/application/gestionarEtapas.ts';
import { RecursoNoEncontradoError } from '../../src/shared/errores.ts';

describe('gestionarEtapas', () => {
  it.skipIf(!hayDocker())('6.4 alta/baja/reorden conserva horasVendidas y reenumera', async () => {
    await conBase(async ({ prisma }) => {
      const deps = crearDependencias(prisma);
      const s = randomUUID().slice(0, 8);
      const op = await createOp(deps, { numeroOp: `OT-E-${s}`, codigoPlano: null, clienteNombre: 'C', descripcionPieza: 'P', fechaEntrega: '2027-01-01', montoVendido: '10.00', observaciones: null, materiales: [], etapas: [{ nombre: 'A', horasVendidas: '1.00' }, { nombre: 'B', horasVendidas: '7.50' }, { nombre: 'C', horasVendidas: '0.00' }] });
      const altas = await gestionarEtapas(deps, op.op.id, { accion: 'alta', nombre: 'D', horasVendidas: '2.00' });
      expect(altas.map(e => e.nombre)).toEqual(['A','B','C','D']);
      const reorden = await gestionarEtapas(deps, op.op.id, { accion: 'reorden', etapaIds: [altas[0]!.id, altas[2]!.id, altas[3]!.id, altas[1]!.id] });
      expect(reorden.map(e => e.nombre)).toEqual(['A','C','D','B']);
      expect(reorden[3]!.horasVendidas).toBe('7.50');
      expect(reorden.map(e => e.ordenSecuencia)).toEqual([1,2,3,4]);
      const baja = await gestionarEtapas(deps, op.op.id, { accion: 'baja', etapaId: altas[2]!.id });
      expect(baja.map(e => e.nombre)).toEqual(['A','D','B']);
      expect(baja.map(e => e.ordenSecuencia)).toEqual([1,2,3]);
    });
  }, 180000);

  it.skipIf(!hayDocker())('6.5 TRIANGULA: etapa ajena a OP da 404 y unicidad case-insensitive en alta', async () => {
    await conBase(async ({ prisma }) => {
      const deps = crearDependencias(prisma);
      const s = randomUUID().slice(0, 8);
      const a = await createOp(deps, { numeroOp: `OT-EA-${s}`, codigoPlano: null, clienteNombre: 'C', descripcionPieza: 'P', fechaEntrega: '2027-01-01', montoVendido: '10.00', observaciones: null, materiales: [] });
      const b = await createOp(deps, { numeroOp: `OT-EB-${s}`, codigoPlano: null, clienteNombre: 'C', descripcionPieza: 'P', fechaEntrega: '2027-01-01', montoVendido: '10.00', observaciones: null, materiales: [] });
      await expect(gestionarEtapas(deps, a.op.id, { accion: 'baja', etapaId: b.etapas[0]!.id })).rejects.toBeInstanceOf(RecursoNoEncontradoError);
      await expect(gestionarEtapas(deps, a.op.id, { accion: 'alta', nombre: ' corte ', horasVendidas: '0.00' })).rejects.toThrow(/duplicad/i);
    });
  }, 180000);
});
