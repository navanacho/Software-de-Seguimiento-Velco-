import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildApp } from '../../src/features/salud/http/app.ts';
import {
  configuracionPrueba,
  crearConfiguracion,
  crearDependenciasFalsas,
  crearEtapa,
  crearEtapas,
  crearOrden,
  crearRegistroHora,
} from './fixtures.ts';

describe('GET /api/ops/:id', () => {
  it('D3 RN-GLOBAL-04 devuelve 404 not_found para una OP inexistente', async () => {
    const id = randomUUID();
    const app = await buildApp(configuracionPrueba(), crearDependenciasFalsas({ ops: [] }).dependencias);
    try {
      const respuesta = await app.inject({ method: 'GET', url: `/api/ops/${id}` });
      expect(respuesta.statusCode).toBe(404);
      expect(respuesta.json()).toMatchObject({ error: 'not_found' });
    } finally {
      await app.close();
    }
  });

  it('D5 RN-GLOBAL-04 TRIANGULA: rechaza ID no UUID con 422', async () => {
    const app = await buildApp(configuracionPrueba(), crearDependenciasFalsas().dependencias);
    try {
      const respuesta = await app.inject({ method: 'GET', url: '/api/ops/no-uuid' });
      expect(respuesta.statusCode).toBe(422);
    } finally {
      await app.close();
    }
  });

  it('D3 RN-ETAPA-01 TRIANGULA: devuelve etapas ordenadas por ordenSecuencia', async () => {
    const ordenId = randomUUID();
    const etapas = [
      crearEtapa({ id: 'etapa-2', ordenId, nombre: 'Soldadura', ordenSecuencia: 2 }),
      crearEtapa({ id: 'etapa-1', ordenId, nombre: 'Corte', ordenSecuencia: 1 }),
    ];
    const { dependencias } = crearDependenciasFalsas({
      ops: [crearOrden({ id: ordenId })],
      etapas,
    });
    const app = await buildApp(configuracionPrueba(), dependencias);
    try {
      const respuesta = await app.inject({ method: 'GET', url: `/api/ops/${ordenId}` });
      expect(respuesta.statusCode).toBe(200);
      expect(respuesta.json().etapas.map((etapa: { nombre: string }) => etapa.nombre)).toEqual([
        'Corte',
        'Soldadura',
      ]);
    } finally {
      await app.close();
    }
  });

  it('D3 RN-GLOBAL-02 OQ-3 exige campos de detalle y horas vacía tipada hasta C-08', async () => {
    const ordenId = randomUUID();
    const orden = crearOrden({
      id: ordenId,
      fechaIngreso: '2026-03-01',
      fechaEntrega: '2026-03-12',
      montoVendido: '1250.50',
      observaciones: 'Revisar tolerancia',
    });
    const { dependencias } = crearDependenciasFalsas({
      ops: [orden],
      etapas: crearEtapas(['Corte'], ordenId),
    });
    const app = await buildApp(configuracionPrueba(), dependencias);
    try {
      const respuesta = await app.inject({ method: 'GET', url: `/api/ops/${ordenId}` });
      expect(respuesta.statusCode).toBe(200);
      expect(respuesta.json()).toMatchObject({
        fechaIngreso: '2026-03-01',
        fechaEntrega: '2026-03-12',
        montoVendido: '1250.50',
        observaciones: 'Revisar tolerancia',
        horas: [],
        horasRealesTotales: '0.00',
        desvioHoras: '1.50',
        porcentajeConsumo: '0.00',
        alertaDesvio: false,
        materiales: [],
        costoMaterialesCotizado: '0.00',
        costoMaterialesReal: '0.00',
      });
    } finally {
      await app.close();
    }
  });

  it('D3 RN-HORAS-01 OQ-3 TRIANGULA: horasVendidas como cadena y sin derivados nuevos', async () => {
    const ordenId = randomUUID();
    const etapas = [
      crearEtapa({
        id: 'etapa-1',
        ordenId,
        nombre: 'Corte',
        ordenSecuencia: 1,
        horasVendidas: '4.00',
      }),
      crearEtapa({
        id: 'etapa-2',
        ordenId,
        nombre: 'Soldadura',
        ordenSecuencia: 2,
        horasVendidas: '1.50',
      }),
    ];
    const { dependencias } = crearDependenciasFalsas({
      ops: [crearOrden({ id: ordenId })],
      etapas,
    });
    const app = await buildApp(configuracionPrueba(), dependencias);
    try {
      const cuerpo = (await app.inject({ method: 'GET', url: `/api/ops/${ordenId}` })).json();
      expect(cuerpo.etapas.map((etapa: { horasVendidas: string }) => etapa.horasVendidas)).toEqual([
        '4.00',
        '1.50',
      ]);
      for (const clave of ['totalHoras', 'horasTotales', 'costos', 'margen', 'desvio', 'desviacion']) {
        expect(Object.hasOwn(cuerpo, clave)).toBe(false);
      }
    } finally {
      await app.close();
    }
  });

  it('C-09 OQ-1=A: el detalle expone los totales de la tarjeta calculados con las horas', async () => {
    const ordenId = randomUUID();
    const { dependencias } = crearDependenciasFalsas({
      ops: [crearOrden({ id: ordenId })],
      etapas: [
        crearEtapa({ id: 'e-1', ordenId, horasVendidas: '4.00' }),
        crearEtapa({ id: 'e-2', ordenId, horasVendidas: '1.50', ordenSecuencia: 2 }),
      ],
      horas: [
        crearRegistroHora({ id: 'h-1', ordenId, horas: '2.50' }),
        crearRegistroHora({ id: 'h-2', ordenId, horas: '1.25' }),
      ],
    });
    const app = await buildApp(configuracionPrueba(), dependencias);
    try {
      const cuerpo = (await app.inject({ method: 'GET', url: `/api/ops/${ordenId}` })).json() as {
        horasVendidasTotales: string;
        horasRealesTotales: string;
      };
      expect(cuerpo.horasVendidasTotales).toBe('5.50');
      expect(cuerpo.horasRealesTotales).toBe('3.75');
    } finally {
      await app.close();
    }
  });

  it('C-11 RN-GLOBAL-02 el handler transporta los derivados que produce el dominio', async () => {
    const ordenId = randomUUID();
    const { dependencias } = crearDependenciasFalsas({
      ops: [crearOrden({ id: ordenId, montoVendido: '1250.50' })],
      etapas: crearEtapas(['Corte'], ordenId),
    });
    const app = await buildApp(configuracionPrueba(), dependencias);
    try {
      const cuerpo = (await app.inject({ method: 'GET', url: `/api/ops/${ordenId}` })).json() as {
        comparativaPorEtapa: readonly { nombreEtapa: string }[];
        margenReal: string;
        tasaGlobalNoConfigurada: boolean;
      };
      expect(cuerpo.comparativaPorEtapa.length).toBeGreaterThan(0);
      expect(cuerpo.margenReal).toBe('1250.50');
      expect(cuerpo.tasaGlobalNoConfigurada).toBe(true);
    } finally {
      await app.close();
    }
  });

  it('C-11 RN-GLOBAL-02 TRIANGULA: tasa configurada calcula margen y apaga el flag', async () => {
    const ordenId = randomUUID();
    const etapas = crearEtapas(['Corte'], ordenId);
    const { dependencias } = crearDependenciasFalsas({
      ops: [crearOrden({ id: ordenId, montoVendido: '1250.50' })],
      etapas,
      horas: [
        crearRegistroHora({
          id: 'hora-c11',
          ordenId,
          etapaId: etapas[0]!.id,
          horas: '2.00',
        }),
      ],
      configuracion: crearConfiguracion({ valorHoraEstandar: '10.00' }),
    });
    const app = await buildApp(configuracionPrueba(), dependencias);
    try {
      const cuerpo = (await app.inject({ method: 'GET', url: `/api/ops/${ordenId}` })).json() as {
        margenReal: string;
        tasaGlobalNoConfigurada: boolean;
        comparativaPorEtapa: readonly { horasReales: string }[];
      };
      expect(cuerpo.margenReal).toBe('1230.50');
      expect(cuerpo.tasaGlobalNoConfigurada).toBe(false);
      expect(cuerpo.comparativaPorEtapa[0]?.horasReales).toBe('2.00');
    } finally {
      await app.close();
    }
  });

  it('C-09 RN-GLOBAL-02: el detalle reutiliza la tarjeta del dominio sin recalcular totales', () => {
    const casoDeUso = readFileSync(
      new URL('../../src/features/ordenes/application/obtenerOp.ts', import.meta.url),
      'utf8',
    );
    expect(casoDeUso).toMatch(/construirTarjetaOrden\([\s\S]*?horas\.map\(/);
    expect(casoDeUso).not.toContain('calcularHorasVendidasTotales(');
    expect(casoDeUso).not.toContain('calcularHorasRealesTotales(');
  });

  it('D3 RN-GLOBAL-02 / R9 el caso de uso no replica la conversiÃ³n de Prisma.Decimal', () => {
    const casoDeUso = readFileSync(
      new URL('../../src/features/ordenes/application/obtenerOp.ts', import.meta.url),
      'utf8',
    );
    const adaptador = readFileSync(
      new URL('../../src/features/ordenes/prisma/PrismaOpRepository.ts', import.meta.url),
      'utf8',
    );
    expect(adaptador).toContain('toFixed(2)');
    expect(casoDeUso).not.toContain('toFixed');
    expect(casoDeUso).not.toContain('Prisma');
  });
});

