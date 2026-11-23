import { describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { conAppReal, hayDocker } from '../tablero-read-api/ayuda.ts';

async function crearOp(app: Awaited<ReturnType<typeof import('../../src/features/salud/http/app.ts').buildApp>>) {
  const sufijo = randomUUID().slice(0, 8);
  const res = await app.inject({
    method: 'POST',
    url: '/api/ops',
    payload: {
      numeroOp: `OT-H-${sufijo}`,
      clienteNombre: `Cliente ${sufijo}`,
      descripcionPieza: 'Pieza',
      fechaEntrega: '2027-01-01',
      montoVendido: '100.00',
      materiales: [],
      etapas: [{ nombre: 'Corte', horasVendidas: '4.00' }],
    },
  });
  return res.json() as { id: string; etapas: Array<{ id: string }> };
}

describe('C-08 5.x registros-horas-api', () => {
  it.skipIf(!hayDocker())('5.2/5.15 RN-HORAS-05 alta válida devuelve 201 con parte', async () => {
    await conAppReal(async ({ app }) => {
      const op = await crearOp(app);
      const res = await app.inject({
        method: 'POST',
        url: `/api/ops/${op.id}/horas`,
        payload: { etapaId: op.etapas[0]?.id, operario: 'Ana', fecha: '2026-11-20', horas: '2.50', observacion: 'ok' },
      });
      expect(res.statusCode).toBe(201);
      expect(res.json()).toMatchObject({ ordenId: op.id, operario: 'Ana', horas: '2.50', observacion: 'ok' });
    });
  }, 180_000);

  it.skipIf(!hayDocker())('5.4/5.7 RN-HORAS-05 horas 0/-1 devuelven 422 validation_error', async () => {
    await conAppReal(async ({ app }) => {
      const op = await crearOp(app);
      for (const horas of ['0', '-1.00']) {
        const res = await app.inject({ method: 'POST', url: `/api/ops/${op.id}/horas`, payload: { operario: 'Ana', fecha: '2026-11-20', horas } });
        expect(res.statusCode).toBe(422);
        expect(res.json().error).toBe('validation_error');
      }
    });
  }, 180_000);

  it.skipIf(!hayDocker())('5.5 P-3 etapa inexistente/otra OP devuelve 422 details.path etapaId', async () => {
    await conAppReal(async ({ app }) => {
      const op = await crearOp(app);
      const otra = await crearOp(app);
      const inexistente = await app.inject({ method: 'POST', url: `/api/ops/${op.id}/horas`, payload: { etapaId: randomUUID(), operario: 'Ana', fecha: '2026-11-20', horas: '1.00' } });
      expect(inexistente.statusCode).toBe(422);
      expect(inexistente.json().details[0].path).toContain('etapaId');
      const otraOp = await app.inject({ method: 'POST', url: `/api/ops/${op.id}/horas`, payload: { etapaId: otra.etapas[0]?.id, operario: 'Ana', fecha: '2026-11-20', horas: '1.00' } });
      expect(otraOp.statusCode).toBe(422);
      expect(otraOp.json().details[0].path).toContain('etapaId');
    });
  }, 180_000);
});
