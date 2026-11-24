import { readFileSync } from 'node:fs';
import type { OrdenTrabajo } from '@velco/domain';
import { describe, expect, it } from 'vitest';
import { listarOps } from '../../src/features/ordenes/application/listarOps.ts';
import { buildApp } from '../../src/features/salud/http/app.ts';
import {
  configuracionPrueba,
  crearCliente,
  crearDependenciasFalsas,
  crearEtapa,
  crearEtapas,
  crearOrden,
  crearRegistroHora,
} from '../tablero-read-api/fixtures.ts';

describe('listarOps', () => {
  it('D2 devuelve una tarjeta por OP con derivados del dominio, KPIs y flujo', async () => {
    const ordenA = crearOrden({
      id: 'op-a',
      numeroOp: 'OT-1002',
      clienteId: 'cli-1',
      fechaEntrega: '2026-03-12',
    });
    const ordenB = crearOrden({
      id: 'op-b',
      numeroOp: 'OT-1001',
      clienteId: 'cli-2',
      fechaEntrega: '2026-03-12',
    });
    const etapas = [
      ...crearEtapas(['Corte', 'Soldadura'], 'op-a'),
      ...crearEtapas(['Corte'], 'op-b'),
    ];
    const clientes = [
      crearCliente({ id: 'cli-1', nombre: 'Cliente Norte' }),
      crearCliente({ id: 'cli-2', nombre: 'Cliente Sur' }),
    ];
    const { dependencias } = crearDependenciasFalsas({ ops: [ordenA, ordenB], etapas, clientes });

    const respuesta = await listarOps(dependencias, {});

    expect(respuesta.ops.map((op) => op.numeroOp)).toEqual(['OT-1001', 'OT-1002']);
    expect(respuesta.ops[0]).toMatchObject({
      clienteNombre: 'Cliente Sur',
      etapaAhora: 'Corte',
      avance: 0,
      semaforo: 'En plazo',
    });
    expect(respuesta.kpis).toEqual({
      total: 2,
      porEstado: { Terminado: 0, Atrasado: 0, 'En riesgo': 0, 'En plazo': 2 },
    });
    expect(respuesta.flujo).toEqual([{ etapa: 'Corte', cantidad: 2 }]);
  });

  it('D2 TRIANGULA: una OP sin etapas conserva avance 0 y etapaAhora "Todo listo"', async () => {
    const { dependencias } = crearDependenciasFalsas({
      ops: [crearOrden({ id: 'op-vacia', numeroOp: 'OT-2000' })],
      etapas: [],
    });
    const respuesta = await listarOps(dependencias, {});
    expect(respuesta.ops[0]).toMatchObject({
      numeroOp: 'OT-2000',
      avance: 0,
      etapaAhora: 'Todo listo',
      etapas: [],
    });
    expect(respuesta.flujo).toEqual([]);
  });

  it('D2 TRIANGULA: conserva clienteNombre: null cuando no hay cliente', async () => {
    const { dependencias } = crearDependenciasFalsas({
      ops: [crearOrden({ id: 'op-sin-cliente', clienteId: 'cli-inexistente' })],
      clientes: [],
    });
    const respuesta = await listarOps(dependencias, {});
    expect(respuesta.ops).toMatchObject([{ clienteNombre: null }]);
  });

  it('D2 RN-SEMAFORO-01 filtra por semáforo derivado Terminado', async () => {
    const vencida = crearOrden({
      id: 'op-vencida',
      numeroOp: 'OT-0001',
      fechaEntrega: '2026-03-01',
    });
    const enPlazo = crearOrden({
      id: 'op-plazo',
      numeroOp: 'OT-0002',
      fechaEntrega: '2026-03-20',
    });
    const etapas = [
      ...crearEtapas(['Corte', 'Soldadura'], 'op-vencida', 2),
      ...crearEtapas(['Corte'], 'op-plazo'),
    ];
    const { dependencias } = crearDependenciasFalsas({ ops: [vencida, enPlazo], etapas });

    const respuesta = await listarOps(dependencias, { estado: 'Terminado' });

    expect(respuesta.ops.map((op) => op.numeroOp)).toEqual(['OT-0001']);
  });

  function sembrarSemáforos() {
    return crearDependenciasFalsas({
      ops: [
        crearOrden({ id: 'op-riesgo', numeroOp: 'OT-RIESGO', fechaEntrega: '2026-03-10' }),
        crearOrden({ id: 'op-atrasado', numeroOp: 'OT-ATRASADO', fechaEntrega: '2026-03-01' }),
        crearOrden({ id: 'op-plazo', numeroOp: 'OT-PLAZO', fechaEntrega: '2026-03-20' }),
      ],
      etapas: [
        ...crearEtapas(['Corte'], 'op-riesgo'),
        ...crearEtapas(['Corte'], 'op-atrasado'),
        ...crearEtapas(['Corte'], 'op-plazo'),
      ],
    });
  }

  it('D2 TRIANGULA: filtra En riesgo', async () => {
    const respuesta = await listarOps(sembrarSemáforos().dependencias, { estado: 'En riesgo' });
    expect(respuesta.ops.map((op) => op.numeroOp)).toEqual(['OT-RIESGO']);
  });

  it('D2 TRIANGULA: filtra Atrasado', async () => {
    const respuesta = await listarOps(sembrarSemáforos().dependencias, { estado: 'Atrasado' });
    expect(respuesta.ops.map((op) => op.numeroOp)).toEqual(['OT-ATRASADO']);
  });

  it('D2 TRIANGULA: filtra En plazo', async () => {
    const respuesta = await listarOps(sembrarSemáforos().dependencias, { estado: 'En plazo' });
    expect(respuesta.ops.map((op) => op.numeroOp)).toEqual(['OT-PLAZO']);
  });

  it('D2 RN-AHORA-01 filtra por etapaAhora derivada de etapas desordenadas', async () => {
    const etapas = [
      crearEtapa({
        id: 'etapa-0',
        ordenId: 'op-desordenada',
        nombre: 'Soldadura',
        ordenSecuencia: 2,
      }),
      crearEtapa({
        id: 'etapa-1',
        ordenId: 'op-desordenada',
        nombre: 'Corte',
        ordenSecuencia: 1,
        completada: true,
      }),
      crearEtapa({
        id: 'etapa-2',
        ordenId: 'op-desordenada',
        nombre: 'Pintura',
        ordenSecuencia: 3,
      }),
      ...crearEtapas(['Corte'], 'op-ordenada'),
    ];
    const { dependencias } = crearDependenciasFalsas({
      ops: [
        crearOrden({ id: 'op-desordenada', numeroOp: 'OT-DESORDENADA' }),
        crearOrden({ id: 'op-ordenada', numeroOp: 'OT-ORDENADA' }),
      ],
      etapas,
    });

    const respuesta = await listarOps(dependencias, { etapaAhora: 'Soldadura' });

    expect(respuesta.ops.map((op) => op.numeroOp)).toEqual(['OT-DESORDENADA']);
  });

  it('D2 filtra por clienteId exacto', async () => {
    const { dependencias } = crearDependenciasFalsas({
      ops: [
        crearOrden({ id: 'op-norte', numeroOp: 'OT-NORTE', clienteId: 'cli-norte' }),
        crearOrden({ id: 'op-sur', numeroOp: 'OT-SUR', clienteId: 'cli-sur' }),
      ],
      etapas: [...crearEtapas(['Corte'], 'op-norte'), ...crearEtapas(['Corte'], 'op-sur')],
      clientes: [
        crearCliente({ id: 'cli-norte', nombre: 'Cliente Norte' }),
        crearCliente({ id: 'cli-sur', nombre: 'Cliente Sur' }),
      ],
    });
    const respuesta = await listarOps(dependencias, { clienteId: 'cli-sur' });
    expect(respuesta.ops.map((op) => op.numeroOp)).toEqual(['OT-SUR']);
  });

  it('D2 busca por N° de OP sin distinguir mayúsculas', async () => {
    const { dependencias } = crearDependenciasFalsas({
      ops: [
        crearOrden({ id: 'op-uno', numeroOp: 'OT-ABCDE', descripcionPieza: 'Eje de transmisión' }),
        crearOrden({ id: 'op-dos', numeroOp: 'OT-ZZZZZ', descripcionPieza: 'Cámara de freno' }),
      ],
      etapas: [...crearEtapas(['Corte'], 'op-uno'), ...crearEtapas(['Corte'], 'op-dos')],
    });
    const respuesta = await listarOps(dependencias, { buscar: 'abcde' });
    expect(respuesta.ops.map((op) => op.numeroOp)).toEqual(['OT-ABCDE']);
  });

  it('D2 TRIANGULA: busca por pieza con mayúsculas distintas', async () => {
    const { dependencias } = crearDependenciasFalsas({
      ops: [
        crearOrden({ id: 'op-uno', numeroOp: 'OT-ABCDE', descripcionPieza: 'Eje de transmisión' }),
        crearOrden({ id: 'op-dos', numeroOp: 'OT-ZZZZZ', descripcionPieza: 'Cámara de freno' }),
      ],
      etapas: [...crearEtapas(['Corte'], 'op-uno'), ...crearEtapas(['Corte'], 'op-dos')],
    });
    const respuesta = await listarOps(dependencias, { buscar: 'FRENO' });
    expect(respuesta.ops.map((op) => op.numeroOp)).toEqual(['OT-ZZZZZ']);
  });

  it('D2 TRIANGULA: combina todos los filtros a la vez', async () => {
    const { dependencias } = crearDependenciasFalsas({
      ops: [
        crearOrden({
          id: 'op-match',
          numeroOp: 'OT-MATCH',
          clienteId: 'cli-norte',
          fechaEntrega: '2026-03-12',
          descripcionPieza: 'Eje de transmisión',
        }),
        crearOrden({
          id: 'op-otro-cliente',
          numeroOp: 'OT-CLIENTE',
          clienteId: 'cli-sur',
          fechaEntrega: '2026-03-12',
          descripcionPieza: 'Eje de transmisión',
        }),
        crearOrden({
          id: 'op-terminada',
          numeroOp: 'OT-TERMINADA',
          clienteId: 'cli-norte',
          fechaEntrega: '2026-03-12',
          descripcionPieza: 'Eje de transmisión',
        }),
        crearOrden({
          id: 'op-fecha',
          numeroOp: 'OT-FECHA',
          clienteId: 'cli-norte',
          fechaEntrega: '2026-03-20',
          descripcionPieza: 'Eje de transmisión',
        }),
      ],
      etapas: [
        ...crearEtapas(['Corte'], 'op-match'),
        ...crearEtapas(['Corte'], 'op-otro-cliente'),
        ...crearEtapas(['Corte'], 'op-terminada', 1),
        ...crearEtapas(['Corte'], 'op-fecha'),
      ],
      clientes: [
        crearCliente({ id: 'cli-norte', nombre: 'Cliente Norte' }),
        crearCliente({ id: 'cli-sur', nombre: 'Cliente Sur' }),
      ],
    });
    const respuesta = await listarOps(dependencias, {
      fechaDesde: '2026-03-10',
      fechaHasta: '2026-03-15',
      estado: 'En plazo',
      clienteId: 'cli-norte',
      etapaAhora: 'Corte',
      buscar: 'EJE',
    });
    expect(respuesta.ops.map((op) => op.numeroOp)).toEqual(['OT-MATCH']);
  });

  it('D2 OQ-1 filtra por rango sobre fechaEntrega', async () => {
    const { dependencias } = crearDependenciasFalsas({
      ops: [
        crearOrden({ id: 'op-antigua', numeroOp: 'OT-ANTIGUA', fechaEntrega: '2026-03-05' }),
        crearOrden({ id: 'op-media', numeroOp: 'OT-MEDIA', fechaEntrega: '2026-03-12' }),
        crearOrden({ id: 'op-futura', numeroOp: 'OT-FUTURA', fechaEntrega: '2026-03-20' }),
      ],
      etapas: [
        ...crearEtapas(['Corte'], 'op-antigua'),
        ...crearEtapas(['Corte'], 'op-media'),
        ...crearEtapas(['Corte'], 'op-futura'),
      ],
    });
    const respuesta = await listarOps(dependencias, {
      fechaDesde: '2026-03-10',
      fechaHasta: '2026-03-15',
    });
    expect(respuesta.ops.map((op) => op.numeroOp)).toEqual(['OT-MEDIA']);
  });

  it('D2 devuelve KPIs en cero con flujo del tablero completo sin coincidencias', async () => {
    const { dependencias } = crearDependenciasFalsas({
      ops: [
        crearOrden({ id: 'op-uno', numeroOp: 'OT-UNO', fechaEntrega: '2026-03-12' }),
        crearOrden({ id: 'op-dos', numeroOp: 'OT-DOS', fechaEntrega: '2026-03-13' }),
      ],
      etapas: [...crearEtapas(['Corte'], 'op-uno'), ...crearEtapas(['Soldadura'], 'op-dos')],
    });
    const respuesta = await listarOps(dependencias, { estado: 'Terminado' });
    expect(respuesta.ops).toEqual([]);
    expect(respuesta.kpis).toEqual({
      total: 0,
      porEstado: { Terminado: 0, Atrasado: 0, 'En riesgo': 0, 'En plazo': 0 },
    });
    expect(respuesta.flujo).toEqual([
      { etapa: 'Corte', cantidad: 1 },
      { etapa: 'Soldadura', cantidad: 1 },
    ]);
  });

  it('D2 OQ-2 ordena por fechaEntrega ascendente y numeroOp como desempate', async () => {
    const { dependencias } = crearDependenciasFalsas({
      ops: [
        crearOrden({ id: 'op-c', numeroOp: 'OT-C', fechaEntrega: '2026-03-15' }),
        crearOrden({ id: 'op-a', numeroOp: 'OT-A', fechaEntrega: '2026-03-10' }),
        crearOrden({ id: 'op-b', numeroOp: 'OT-B', fechaEntrega: '2026-03-10' }),
      ],
      etapas: [
        ...crearEtapas(['Corte'], 'op-c'),
        ...crearEtapas(['Corte'], 'op-a'),
        ...crearEtapas(['Corte'], 'op-b'),
      ],
    });
    const respuesta = await listarOps(dependencias, {});
    expect(respuesta.ops.map((op) => op.numeroOp)).toEqual(['OT-A', 'OT-B', 'OT-C']);
  });

  it('D2 la ruta GET /api/ops devuelve el envelope con la query validada', async () => {
    const { dependencias } = crearDependenciasFalsas({
      ops: [
        crearOrden({ id: 'op-uno', numeroOp: 'OT-UNO', fechaEntrega: '2026-03-12' }),
        crearOrden({ id: 'op-dos', numeroOp: 'OT-DOS', fechaEntrega: '2026-03-13' }),
      ],
      etapas: [...crearEtapas(['Corte'], 'op-uno'), ...crearEtapas(['Corte'], 'op-dos')],
    });
    const app = await buildApp(configuracionPrueba(), dependencias);
    try {
      const respuesta = await app.inject({ method: 'GET', url: '/api/ops?buscar=uno' });
      expect(respuesta.statusCode).toBe(200);
      expect(respuesta.json()).toMatchObject({
        ops: [{ numeroOp: 'OT-UNO' }],
        kpis: { total: 1 },
        flujo: [{ etapa: 'Corte', cantidad: 2 }],
      });
    } finally {
      await app.close();
    }
  });

  it('D2 RN-FLujo-01 una OP terminada no aparece en flujo', async () => {
    const { dependencias } = crearDependenciasFalsas({
      ops: [
        crearOrden({ id: 'op-terminada', numeroOp: 'OT-TERMINADA' }),
        crearOrden({ id: 'op-activa', numeroOp: 'OT-ACTIVA' }),
      ],
      etapas: [
        ...crearEtapas(['Corte'], 'op-terminada', 1),
        ...crearEtapas(['Soldadura'], 'op-activa'),
      ],
    });
    const respuesta = await listarOps(dependencias, {});
    expect(respuesta.flujo).toEqual([{ etapa: 'Soldadura', cantidad: 1 }]);
  });

  it('D2 TRIANGULA: flujo estable con entradas permutadas', async () => {
    const sembrar = (ops: readonly OrdenTrabajo[]) =>
      crearDependenciasFalsas({
        ops: [...ops],
        etapas: ops.flatMap((op) => crearEtapas(['Corte'], op.id)),
      });
    const opA = crearOrden({ id: 'op-a', numeroOp: 'OT-A' });
    const opB = crearOrden({ id: 'op-b', numeroOp: 'OT-B' });
    const opC = crearOrden({ id: 'op-c', numeroOp: 'OT-C' });

    const respuesta = await listarOps(sembrar([opC, opA, opB]).dependencias, {});
    const permutada = await listarOps(sembrar([opB, opC, opA]).dependencias, {});

    expect(respuesta.flujo).toEqual([{ etapa: 'Corte', cantidad: 3 }]);
    expect(permutada.flujo).toEqual(respuesta.flujo);
  });

  it('C-09 OQ-1=A: el listado trae totales de horas por OP calculados en dominio', async () => {
    const { dependencias } = crearDependenciasFalsas({
      ops: [crearOrden({ id: 'op-a', numeroOp: 'OT-A' }), crearOrden({ id: 'op-b', numeroOp: 'OT-B' })],
      etapas: [
        crearEtapa({ id: 'e-a', ordenId: 'op-a', horasVendidas: '4.00' }),
        crearEtapa({ id: 'e-b', ordenId: 'op-b', horasVendidas: '2.50' }),
      ],
      horas: [
        crearRegistroHora({ id: 'h-1', ordenId: 'op-a', horas: '2.50' }),
        crearRegistroHora({ id: 'h-2', ordenId: 'op-a', horas: '1.25' }),
        crearRegistroHora({ id: 'h-3', ordenId: 'op-b', horas: '0.75' }),
      ],
    });

    const respuesta = await listarOps(dependencias, {});

    expect(respuesta.ops.find((op) => op.id === 'op-a')).toMatchObject({
      horasVendidasTotales: '4.00',
      horasRealesTotales: '3.75',
    });
    expect(respuesta.ops.find((op) => op.id === 'op-b')).toMatchObject({
      horasVendidasTotales: '2.50',
      horasRealesTotales: '0.75',
    });
  });

  it('C-09 OQ-1=A TRIANGULA: sin partes el listado reporta 0.00 horas reales', async () => {
    const { dependencias } = crearDependenciasFalsas({
      ops: [crearOrden({ id: 'op-sin-horas', numeroOp: 'OT-SIN-HORAS' })],
      etapas: [crearEtapa({ id: 'e-unica', ordenId: 'op-sin-horas', horasVendidas: '4.00' })],
    });

    const respuesta = await listarOps(dependencias, {});

    expect(respuesta.ops[0]).toMatchObject({ horasVendidasTotales: '4.00', horasRealesTotales: '0.00' });
  });

  it('C-09 GET /api/ops serializa los totales de horas en el contrato', async () => {
    const { dependencias } = crearDependenciasFalsas({
      ops: [crearOrden({ id: 'op-http', numeroOp: 'OT-HTTP' })],
      etapas: [crearEtapa({ id: 'e-http', ordenId: 'op-http', horasVendidas: '4.00' })],
      horas: [crearRegistroHora({ id: 'h-http', ordenId: 'op-http', horas: '3.00' })],
    });
    const app = await buildApp(configuracionPrueba(), dependencias);
    try {
      const respuesta = await app.inject({ method: 'GET', url: '/api/ops' });
      expect(respuesta.statusCode).toBe(200);
      const cuerpo = respuesta.json() as { ops: readonly { horasVendidasTotales?: string; horasRealesTotales?: string }[] };
      expect(cuerpo.ops[0]).toMatchObject({ horasVendidasTotales: '4.00', horasRealesTotales: '3.00' });
    } finally {
      await app.close();
    }
  });

  it('D2 RN-GLOBAL-02 el handler no calcula semáforos ni agrupa flujo', () => {
    const codigo = readFileSync(
      new URL('../../src/features/ordenes/http/registrarRutas.ts', import.meta.url),
      'utf8',
    );
    expect(codigo).not.toContain('agruparFlujo');
    expect(codigo).not.toMatch(/semaforo/);
  });
});
