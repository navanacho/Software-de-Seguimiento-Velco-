import { randomUUID } from 'node:crypto';
import { Prisma, type PrismaClient } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { conAppReal, hayDocker } from './ayuda.ts';

function fechaRelativa(dias: number): Date {
  const fecha = new Date();
  fecha.setUTCDate(fecha.getUTCDate() + dias);
  return new Date(fecha.toISOString().slice(0, 10) + 'T00:00:00.000Z');
}

interface Semilla {
  readonly clienteId: string;
  readonly numeroOp: string;
  readonly idsEtapas: readonly string[];
}

async function sembrarOP(
  prisma: PrismaClient,
  clienteId: string,
  sufijo: string,
  diasEntrega: number,
  completadas: number,
): Promise<Semilla> {
  const numeroOp = `OT-INT-${sufijo}`;
  const orden = await prisma.ordenTrabajo.create({
    data: {
      numeroOp,
      clienteId,
      descripcionPieza: `Pieza ${sufijo}`,
      fechaEntrega: fechaRelativa(diasEntrega),
      montoVendido: new Prisma.Decimal('100.50'),
      observaciones: null,
    },
  });
  const etapas = await Promise.all(
    ['Corte', 'Soldadura'].map((nombre, indice) =>
      prisma.etapaOrden.create({
        data: {
          ordenId: orden.id,
          nombre,
          ordenSecuencia: indice + 1,
          completada: indice < completadas,
          horasVendidas: new Prisma.Decimal(indice === 0 ? '4.00' : '2.50'),
        },
      }),
    ),
  );
  return { clienteId, numeroOp, idsEtapas: etapas.map((etapa) => etapa.id) };
}

async function sembrarEscenario(prisma: PrismaClient) {
  const cliente = await prisma.cliente.create({
    data: { nombre: `Cliente Integración ${randomUUID().slice(0, 8)}` },
  });
  const terminada = await sembrarOP(prisma, cliente.id, 'TERM', -10, 2);
  const atrasada = await sembrarOP(prisma, cliente.id, 'ATR', -5, 0);
  const riesgo = await sembrarOP(prisma, cliente.id, 'RIES', 1, 0);
  const enPlazo = await sembrarOP(prisma, cliente.id, 'PLAZO', 12, 0);
  return { terminada, atrasada, riesgo, enPlazo };
}

describe.skipIf(!hayDocker())('integración tablero-read-api con PostgreSQL 18.7', () => {
  it('D7/R10 RN-GLOBAL-02 lista OPs reales con semáforo derivado, flujo y orden determinista', async () => {
    await conAppReal(async ({ app, prisma }) => {
      const semilla = await sembrarEscenario(prisma);
      try {
        const lista = await app.inject({ method: 'GET', url: '/api/ops' });
        expect(lista.statusCode).toBe(200);
        const cuerpo = lista.json();
        expect(cuerpo.kpis.total).toBe(4);
        expect(cuerpo.ops.map((op: { numeroOp: string }) => op.numeroOp)).toEqual([
          semilla.terminada.numeroOp,
          semilla.atrasada.numeroOp,
          semilla.riesgo.numeroOp,
          semilla.enPlazo.numeroOp,
        ]);
        expect(cuerpo.flujo).toEqual([{ etapa: 'Corte', cantidad: 3 }]);
        expect(cuerpo.kpis.porEstado.Terminado).toBe(1);
        expect(cuerpo.kpis.porEstado.Atrasado).toBe(1);
        expect(cuerpo.kpis.porEstado['En riesgo']).toBe(1);
        expect(cuerpo.kpis.porEstado['En plazo']).toBe(1);
      } finally {
        await app.close();
      }
    });
  });

  it('D7 RN-SEMAFORO-01 / RN-SEMAFORO-05 filtra por semáforo derivado sobre datos reales', async () => {
    await conAppReal(async ({ app, prisma }) => {
      const semilla = await sembrarEscenario(prisma);
      const filtrada = await app.inject({
        method: 'GET',
        url: '/api/ops?estado=Terminado',
      });
      expect(filtrada.statusCode).toBe(200);
      expect(filtrada.json().ops.map((op: { numeroOp: string }) => op.numeroOp)).toEqual([
        semilla.terminada.numeroOp,
      ]);
    });
  });

  it('D7 RN-AVANCE-01 / RN-AVANCE-02 PATCH marca, desmarca y rechaza etapa ajena en datos reales', async () => {
    await conAppReal(async ({ app, prisma }) => {
      const semilla = await sembrarEscenario(prisma);
      const id = semilla.enPlazo.numeroOp;
      const orden = await prisma.ordenTrabajo.findUniqueOrThrow({ where: { numeroOp: id } });
      const etapaId = semilla.enPlazo.idsEtapas[0]!;
      try {
        const marcada = await app.inject({
          method: 'PATCH',
          url: `/api/ops/${orden.id}/etapas/${etapaId}`,
          payload: { completada: true },
        });
        expect(marcada.statusCode).toBe(200);
        expect(marcada.json()).toMatchObject({ avance: 50, etapaAhora: 'Soldadura' });

        const desmarcada = await app.inject({
          method: 'PATCH',
          url: `/api/ops/${orden.id}/etapas/${etapaId}`,
          payload: { completada: false },
        });
        expect(desmarcada.statusCode).toBe(200);
        expect(desmarcada.json()).toMatchObject({ avance: 0, etapaAhora: 'Corte' });

        const ajena = await app.inject({
          method: 'PATCH',
          url: `/api/ops/${orden.id}/etapas/${semilla.riesgo.idsEtapas[0]!}`,
          payload: { completada: true },
        });
        expect(ajena.statusCode).toBe(404);
      } finally {
        await app.close();
      }
    });
  });

  it('D7 RN-GLOBAL-02 detalle real incluye etapas, derivados y colecciones vacías OQ-3', async () => {
    await conAppReal(async ({ app, prisma }) => {
      const semilla = await sembrarEscenario(prisma);
      const orden = await prisma.ordenTrabajo.findUniqueOrThrow({
        where: { numeroOp: semilla.enPlazo.numeroOp },
      });
      const respuesta = await app.inject({ method: 'GET', url: `/api/ops/${orden.id}` });
      expect(respuesta.statusCode).toBe(200);
      const detalle = respuesta.json();
      expect(detalle).toMatchObject({
        numeroOp: semilla.enPlazo.numeroOp,
        montoVendido: '100.50',
        horas: [],
        materiales: [],
      });
      expect(detalle.etapas.map((etapa: { horasVendidas: string }) => etapa.horasVendidas)).toEqual([
        '4.00',
        '2.50',
      ]);
      expect(Object.hasOwn(detalle, 'margen')).toBe(false);
    });
  });
});
