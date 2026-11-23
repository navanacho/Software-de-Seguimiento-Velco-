import { describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { conAppReal, hayDocker } from '../tablero-read-api/ayuda.ts';

async function crearOp(app: any) {
  const sufijo = randomUUID().slice(0, 8);
  const res = await app.inject({
    method: 'POST', url: '/api/ops',
    payload: { numeroOp: `OT-H-${sufijo}`, clienteNombre: `C ${sufijo}`, descripcionPieza: 'P', fechaEntrega: '2027-01-01', montoVendido: '100.00', materiales: [], etapas: [{ nombre: 'Corte', horasVendidas: '4.00' }] },
  });
  return res.json() as { id: string; etapas: Array<{ id: string }> };
}

describe('C-08 5.9-5.14 editar/eliminar horas', () => {
  it.skipIf(!hayDocker())('5.10/5.13 PATCH parcial actualiza y devuelve 200; DELETE devuelve {ok:true}', async () => {
    await conAppReal(async ({ app }) => {
      const op = await crearOp(app);
      const alta = await app.inject({ method: 'POST', url: `/api/ops/${op.id}/horas`, payload: { operario: 'Ana', fecha: '2026-11-20', horas: '1.00', observacion: null } });
      const parteId = alta.json().id;
      const patch = await app.inject({ method: 'PATCH', url: `/api/ops/${op.id}/horas/${parteId}`, payload: { horas: '2.00' } });
      expect(patch.statusCode).toBe(200);
      expect(patch.json().horas).toBe('2.00');
      const del = await app.inject({ method: 'DELETE', url: `/api/ops/${op.id}/horas/${parteId}` });
      expect(del.statusCode).toBe(200);
      expect(del.json()).toEqual({ ok: true });
    });
  }, 180_000);

  it.skipIf(!hayDocker())('5.11 PATCH vacío 422; 5.12/5.14 inexistente 404', async () => {
    await conAppReal(async ({ app }) => {
      const op = await crearOp(app);
      const alta = await app.inject({ method: 'POST', url: `/api/ops/${op.id}/horas`, payload: { operario: 'Ana', fecha: '2026-11-20', horas: '1.00' } });
      const parteId = alta.json().id;
      const vacio = await app.inject({ method: 'PATCH', url: `/api/ops/${op.id}/horas/${parteId}`, payload: {} });
      expect(vacio.statusCode).toBe(422);
      const noExiste = randomUUID();
      const patch404 = await app.inject({ method: 'PATCH', url: `/api/ops/${op.id}/horas/${noExiste}`, payload: { horas: '1.00' } });
      expect(patch404.statusCode).toBe(404);
      const del404 = await app.inject({ method: 'DELETE', url: `/api/ops/${op.id}/horas/${noExiste}` });
      expect(del404.statusCode).toBe(404);
    });
  }, 180_000);
});
