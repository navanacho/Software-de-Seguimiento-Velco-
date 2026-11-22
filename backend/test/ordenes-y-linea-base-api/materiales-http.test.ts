import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { conBase, hayDocker } from '../tablero-read-api/ayuda.ts';
import { buildApp } from '../../src/features/salud/http/app.ts';
import { crearDependencias } from '../../src/shared/dependencias.ts';
import { configuracionPrueba } from '../tablero-read-api/fixtures.ts';
import { createOp } from '../../src/features/ordenes/application/createOp.ts';

describe('POST /api/ops/:id/materiales', () => {
  it.skipIf(!hayDocker())('7.2/7.3 alta válida, 422 tipo inválido, 404 OP inexistente', async () => {
    await conBase(async ({ prisma }) => {
      const deps = crearDependencias(prisma);
      const app = await buildApp(configuracionPrueba(), deps);
      try {
        const s = randomUUID().slice(0, 8);
        const op = await createOp(deps, { numeroOp: `OT-MAT-${s}`, codigoPlano: null, clienteNombre: 'C', descripcionPieza: 'P', fechaEntrega: '2027-01-01', montoVendido: '10.00', observaciones: null, materiales: [] });
        const ok = await app.inject({ method: 'POST', url: `/api/ops/${op.op.id}/materiales`, payload: { tipo: 'MP', descripcion: 'Acero', cantidad: '2.5', costoUnitarioCotizado: '100.00', nroRemito: 'R1' } });
        expect(ok.statusCode).toBe(201);
        expect(ok.json()).toMatchObject({ tipo: 'MP', descripcion: 'Acero' });
        const bad = await app.inject({ method: 'POST', url: `/api/ops/${op.op.id}/materiales`, payload: { tipo: 'OTROS_X', descripcion: 'X', cantidad: '1', costoUnitarioCotizado: '1.00' } });
        expect(bad.statusCode).toBe(422);
        const nf = await app.inject({ method: 'POST', url: `/api/ops/${randomUUID()}/materiales`, payload: { tipo: 'MP', descripcion: 'X', cantidad: '1', costoUnitarioCotizado: '1.00' } });
        expect(nf.statusCode).toBe(404);
      } finally { await app.close(); }
    });
  }, 180000);
});
