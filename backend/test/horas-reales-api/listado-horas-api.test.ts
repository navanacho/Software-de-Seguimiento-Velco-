import { describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { calcularHorasRealesTotales } from '@velco/domain';
import { conAppReal, hayDocker } from '../tablero-read-api/ayuda.ts';

async function crearOp(app: FastifyInstance) {
  const sufijo = randomUUID().slice(0, 8);
  const res = await app.inject({
    method: 'POST',
    url: '/api/ops',
    payload: {
      numeroOp: `OT-L-${sufijo}`,
      clienteNombre: `Cliente ${sufijo}`,
      descripcionPieza: 'Pieza',
      fechaEntrega: '2027-01-01',
      montoVendido: '100.00',
      materiales: [],
      etapas: [{ nombre: 'Corte', horasVendidas: '4.00' }],
    },
  });
  expect(res.statusCode).toBe(201);
  return res.json() as { id: string };
}

interface ParteListada {
  id: string;
  ordenId: string;
  fecha: string;
  horas: string;
  observacion: string | null;
}

describe('C-08 5.9-5.11 listado de partes por OP', () => {
  it.skipIf(!hayDocker())('5.9 GET ordena por fecha y expone decimal exacto y observacion (P-1)', async () => {
    await conAppReal(async ({ app }) => {
      const op = await crearOp(app);
      const posterior = await app.inject({
        method: 'POST', url: `/api/ops/${op.id}/horas`,
        payload: { operario: 'Ana', fecha: '2026-11-21', horas: '1.25', observacion: 'turno tarde' },
      });
      const anterior = await app.inject({
        method: 'POST', url: `/api/ops/${op.id}/horas`,
        payload: { operario: 'Beto', fecha: '2026-11-20', horas: '2.50', observacion: null },
      });
      expect(posterior.statusCode).toBe(201);
      expect(anterior.statusCode).toBe(201);

      const res = await app.inject({ method: 'GET', url: `/api/ops/${op.id}/horas` });
      expect(res.statusCode).toBe(200);
      const partes = res.json() as ParteListada[];
      expect(partes.map((p) => p.fecha)).toEqual(['2026-11-20', '2026-11-21']);
      expect(partes.map((p) => p.horas)).toEqual(['2.50', '1.25']);
      expect(partes.map((p) => p.observacion)).toEqual([null, 'turno tarde']);
      expect(partes[0]?.id).toBe(anterior.json().id);
      expect(partes.every((p) => p.ordenId === op.id)).toBe(true);
    });
  }, 180_000);

  it.skipIf(!hayDocker())('5.10 OP sin partes devuelve [] y total 0.00 sin escribir en base', async () => {
    await conAppReal(async ({ app, prisma }) => {
      const op = await crearOp(app);
      const antes = await prisma.ordenTrabajo.findUniqueOrThrow({ where: { id: op.id } });
      const res = await app.inject({ method: 'GET', url: `/api/ops/${op.id}/horas` });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual([]);
      expect(calcularHorasRealesTotales([])).toBe('0.00');
      const despues = await prisma.ordenTrabajo.findUniqueOrThrow({ where: { id: op.id } });
      expect(despues.updatedAt).toEqual(antes.updatedAt);
      expect(await prisma.registroHora.count({ where: { ordenId: op.id } })).toBe(0);
    });
  }, 180_000);

  it.skipIf(!hayDocker())('5.11 UUID de OP inexistente devuelve 404 not_found', async () => {
    await conAppReal(async ({ app }) => {
      const res = await app.inject({ method: 'GET', url: `/api/ops/${randomUUID()}/horas` });
      expect(res.statusCode).toBe(404);
      expect(res.json().error).toBe('not_found');
    });
  }, 180_000);

  it.skipIf(!hayDocker())('5.11 aislamiento entre OPs y desempate por created_at', async () => {
    await conAppReal(async ({ app }) => {
      const opA = await crearOp(app);
      const opB = await crearOp(app);
      const a1 = await app.inject({ method: 'POST', url: `/api/ops/${opA.id}/horas`, payload: { operario: 'Ana', fecha: '2026-11-20', horas: '1.00' } });
      const b1 = await app.inject({ method: 'POST', url: `/api/ops/${opB.id}/horas`, payload: { operario: 'Cid', fecha: '2026-11-19', horas: '5.00' } });
      const a2 = await app.inject({ method: 'POST', url: `/api/ops/${opA.id}/horas`, payload: { operario: 'Beto', fecha: '2026-11-20', horas: '2.00' } });
      expect(a1.statusCode).toBe(201);
      expect(b1.statusCode).toBe(201);
      expect(a2.statusCode).toBe(201);

      const listaA = (await app.inject({ method: 'GET', url: `/api/ops/${opA.id}/horas` })).json() as ParteListada[];
      const listaB = (await app.inject({ method: 'GET', url: `/api/ops/${opB.id}/horas` })).json() as ParteListada[];
      expect(listaA.map((p) => p.id)).toEqual([a1.json().id, a2.json().id]);
      expect(listaA.map((p) => p.horas)).toEqual(['1.00', '2.00']);
      expect(listaB.map((p) => p.id)).toEqual([b1.json().id]);
      expect(listaA.every((p) => p.ordenId === opA.id)).toBe(true);
      expect(listaB.every((p) => p.ordenId === opB.id)).toBe(true);
    });
  }, 180_000);
});
