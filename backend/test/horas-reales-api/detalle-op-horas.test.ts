import { describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { conAppReal, hayDocker } from '../tablero-read-api/ayuda.ts';

async function crearOp(app: FastifyInstance, etapas = [{ nombre: 'Corte', horasVendidas: '4.00' }]) {
  const sufijo = randomUUID().slice(0, 8);
  const res = await app.inject({ method: 'POST', url: '/api/ops', payload: { numeroOp: `OT-D-${sufijo}`, clienteNombre: `C ${sufijo}`, descripcionPieza: 'P', fechaEntrega: '2027-01-01', montoVendido: '100.00', materiales: [], etapas } });
  return res.json() as { id: string; etapas: Array<{ id: string }> };
}

describe('C-08 7.x api-detalle-op', () => {
  it.skipIf(!hayDocker())('7.2/7.5 detalle con partes y derivados recalculados', async () => {
    await conAppReal(async ({ app }) => {
      const op = await crearOp(app);
      await app.inject({ method: 'POST', url: `/api/ops/${op.id}/horas`, payload: { etapaId: op.etapas[0]?.id, operario: 'Ana', fecha: '2026-11-20', horas: '2.50', observacion: 'obs' } });
      await app.inject({ method: 'POST', url: `/api/ops/${op.id}/horas`, payload: { operario: 'Beto', fecha: '2026-11-21', horas: '1.25' } });
      const detalle = await app.inject({ method: 'GET', url: `/api/ops/${op.id}` });
      expect(detalle.statusCode).toBe(200);
      const body = detalle.json();
      expect(body.horas).toHaveLength(2);
      expect(body.horasRealesTotales).toBe('3.75');
      expect(body.desvioHoras).toBe('0.25');
      expect(body.porcentajeConsumo).toBe('93.75');
      expect(body.alertaDesvio).toBe(true); // avance 0, 93.75 > 15
      expect(body.horas[0].observacion).toBe('obs');
    });
  }, 180_000);

  it.skipIf(!hayDocker())('7.5 P-2 vendidas cero => consumo null y alerta por exceso', async () => {
    await conAppReal(async ({ app }) => {
      const op = await crearOp(app, [{ nombre: 'Corte', horasVendidas: '0.00' }]);
      await app.inject({ method: 'POST', url: `/api/ops/${op.id}/horas`, payload: { operario: 'Ana', fecha: '2026-11-20', horas: '1.00' } });
      const body = (await app.inject({ method: 'GET', url: `/api/ops/${op.id}` })).json();
      expect(body.porcentajeConsumo).toBeNull();
      expect(body.alertaDesvio).toBe(true);
      expect(body.horasRealesTotales).toBe('1.00');
    });
  }, 180_000);
});
