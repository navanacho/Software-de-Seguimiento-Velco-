import { construirTarjetaOrden } from '@velco/domain';
import { describe, expect, it } from 'vitest';
import { contextoTarjeta } from '../../src/features/configuracion/application/contextoTarjeta.ts';
import { conAppReal, hayDocker } from '../tablero-read-api/ayuda.ts';
import {
  crearConfiguracion,
  crearDependenciasFalsas,
  crearEtapas,
  crearOrden,
} from '../tablero-read-api/fixtures.ts';

function fechaRelativa(dias: number): Date {
  const fecha = new Date();
  fecha.setUTCDate(fecha.getUTCDate() + dias);
  return new Date(fecha.toISOString().slice(0, 10) + 'T00:00:00.000Z');
}

describe('configuración vigente en la lectura de OP', () => {
  it('contextoTarjeta lee umbrales y tasa frescos en cada llamada', async () => {
    const { dependencias } = crearDependenciasFalsas({
      configuracion: crearConfiguracion({ valorHoraEstandar: '1000.00', diasAlertaRiesgo: 3, porcentajeAvanceRiesgo: 80 }),
    });
    const primero = await contextoTarjeta(dependencias);
    expect(primero.valorHoraEstandar).toBe('1000.00');
    await dependencias.configuracion.actualizar(
      crearConfiguracion({ valorHoraEstandar: '2000.00', diasAlertaRiesgo: 2, porcentajeAvanceRiesgo: 40 }),
    );
    const segundo = await contextoTarjeta(dependencias);
    expect(segundo.valorHoraEstandar).toBe('2000.00');
    expect(segundo.diasAlertaRiesgo).toBe(2);
    expect(segundo.porcentajeAvanceRiesgo).toBe(40);
  });

  it('sin fila singleton aplica la tasa por defecto sin insertar ni derivar', async () => {
    const { dependencias, estado } = crearDependenciasFalsas({ configuracion: null });
    const contexto = await contextoTarjeta(dependencias);
    expect(contexto.valorHoraEstandar).toBe('0.00');
    expect(contexto.diasAlertaRiesgo).toBe(3);
    expect(contexto.porcentajeAvanceRiesgo).toBe(80);
    expect(estado.configuracion).toBeNull();
  });

  it('el semáforo se recalcula con el umbral vigente sin persistir derivados', async () => {
    const orden = crearOrden({ fechaEntrega: '2026-03-10' });
    const etapas = crearEtapas(['Corte', 'Soldadura'], orden.id);
    const { dependencias } = crearDependenciasFalsas({ ops: [orden], etapas });
    const contextoInicial = await contextoTarjeta(dependencias);
    expect(construirTarjetaOrden(orden, etapas, contextoInicial).semaforo).toBe('En riesgo');
    await dependencias.configuracion.actualizar(
      crearConfiguracion({ diasAlertaRiesgo: 2, porcentajeAvanceRiesgo: 80 }),
    );
    const contextoActualizado = await contextoTarjeta(dependencias);
    expect(construirTarjetaOrden(orden, etapas, contextoActualizado).semaforo).toBe('En plazo');
  });
});

describe.skipIf(!hayDocker())('configuración vigente con PostgreSQL real', () => {
  it('GET /api/ops y GET /api/ops/:id usan los umbrales y la tasa vigentes', async () => {
    await conAppReal(async ({ app, dependencias, prisma }) => {
      const cliente = await prisma.cliente.create({
        data: { nombre: `Cliente Config ${Date.now()}` },
      });
      const orden = await prisma.ordenTrabajo.create({
        data: {
          numeroOp: `OT-CONFIG-${Date.now()}`,
          clienteId: cliente.id,
          descripcionPieza: 'Pieza config',
          fechaEntrega: fechaRelativa(3),
        },
      });
      await prisma.etapaOrden.createMany({
        data: [
          { ordenId: orden.id, nombre: 'Corte', ordenSecuencia: 1 },
          { ordenId: orden.id, nombre: 'Soldadura', ordenSecuencia: 2 },
        ],
      });
      await prisma.registroHora.create({
        data: { ordenId: orden.id, operario: 'Ana', horas: '2.00' },
      });
      const actualizar = async (diasAlertaRiesgo: number, valorHoraEstandar: string, porcentajeAvanceRiesgo = 100) => {
        const respuesta = await app.inject({
          method: 'PUT',
          url: '/api/configuracion',
          payload: {
            valorHoraEstandar,
            diasAlertaRiesgo,
            porcentajeAvanceRiesgo,
            etapasDefault: ['Corte', 'Soldadura'],
          },
        });
        expect(respuesta.statusCode).toBe(200);
      };
      await actualizar(5, '1000.00');
      const listado = await app.inject({ method: 'GET', url: '/api/ops' });
      expect(listado.json().ops.find((op: { id: string }) => op.id === orden.id)?.semaforo).toBe('En riesgo');
      const contexto = await contextoTarjeta(dependencias);
      expect(contexto.valorHoraEstandar).toBe('1000.00');
      await actualizar(0, '2000.00');
      const detalle = await app.inject({ method: 'GET', url: `/api/ops/${orden.id}` });
      expect(detalle.statusCode).toBe(200);
      expect(detalle.json().semaforo).toBe('En plazo');
      expect((await contextoTarjeta(dependencias)).valorHoraEstandar).toBe('2000.00');
      const horas = detalle.json().horasRealesTotales;
      expect(horas).toBe('2.00');
    });
  });

  it('el PATCH de etapas reconstruye el derivado con la configuración vigente', async () => {
    await conAppReal(async ({ app, prisma }) => {
      const cliente = await prisma.cliente.create({
        data: { nombre: `Cliente Patch ${Date.now()}` },
      });
      const orden = await prisma.ordenTrabajo.create({
        data: {
          numeroOp: `OT-PATCH-${Date.now()}`,
          clienteId: cliente.id,
          descripcionPieza: 'Pieza patch',
          fechaEntrega: fechaRelativa(3),
        },
      });
      const etapas = await prisma.etapaOrden.createManyAndReturn({
        data: [
          { ordenId: orden.id, nombre: 'Corte', ordenSecuencia: 1 },
          { ordenId: orden.id, nombre: 'Soldadura', ordenSecuencia: 2 },
        ],
      });
      const configuracion = await app.inject({
        method: 'PUT',
        url: '/api/configuracion',
        payload: {
          valorHoraEstandar: '1500.00',
          diasAlertaRiesgo: 5,
          porcentajeAvanceRiesgo: 40,
          etapasDefault: ['Corte'],
        },
      });
      expect(configuracion.statusCode).toBe(200);
      const respuesta = await app.inject({
        method: 'PATCH',
        url: `/api/ops/${orden.id}/etapas/${etapas[0]!.id}`,
        payload: { completada: true },
      });
      expect(respuesta.statusCode).toBe(200);
      expect(respuesta.json()).toMatchObject({ avance: 50, semaforo: 'En plazo' });
      expect(await prisma.configuracion.count()).toBe(1);
    });
  });

  it('monto vendido cero y tasa alta no generan derivados no finitos', async () => {
    await conAppReal(async ({ app, dependencias, prisma }) => {
      const cliente = await prisma.cliente.create({
        data: { nombre: `Cliente Cero ${Date.now()}` },
      });
      const orden = await prisma.ordenTrabajo.create({
        data: {
          numeroOp: `OT-CERO-${Date.now()}`,
          clienteId: cliente.id,
          descripcionPieza: 'Pieza sin monto',
          fechaEntrega: fechaRelativa(3),
          montoVendido: '0.00',
        },
      });
      await prisma.etapaOrden.create({
        data: { ordenId: orden.id, nombre: 'Corte', ordenSecuencia: 1 },
      });
      await prisma.registroHora.create({
        data: { ordenId: orden.id, operario: 'Ana', horas: '3.00' },
      });
      const configuracion = await app.inject({
        method: 'PUT',
        url: '/api/configuracion',
        payload: {
          valorHoraEstandar: '999999.99',
          diasAlertaRiesgo: 5,
          porcentajeAvanceRiesgo: 100,
          etapasDefault: ['Corte'],
        },
      });
      expect(configuracion.statusCode).toBe(200);
      const detalle = await app.inject({ method: 'GET', url: `/api/ops/${orden.id}` });
      expect(detalle.statusCode).toBe(200);
      expect(detalle.body).not.toMatch(/NaN|Infinity/);
      expect(detalle.json().horasRealesTotales).toBe('3.00');
      expect((await contextoTarjeta(dependencias)).valorHoraEstandar).toBe('999999.99');
      const fila = await prisma.configuracion.findUniqueOrThrow({ where: { id: 1 } });
      expect(Object.keys(fila).sort()).toEqual([
        'diasAlertaRiesgo', 'etapasDefault', 'id', 'porcentajeAvanceRiesgo', 'valorHoraEstandar',
      ]);
    });
  });
});
