import {
  comparativaPorEtapa,
  construirModeloPlanilla,
  costoMaterialReal,
  margenReal,
  type EntradaModeloPlanilla,
  type MaterialOrden,
} from '@velco/domain';
import { describe, expect, it } from 'vitest';
import { exportOp } from '../../src/features/exportacion/application/exportOp.ts';
import type { DependenciasApi } from '../../src/shared/dependencias.ts';
import {
  crearCliente,
  crearConfiguracion,
  crearDependenciasFalsas,
  crearEtapas,
  crearOrden,
  crearRegistroHora,
} from '../tablero-read-api/fixtures.ts';

const OP_ID = 'op-1';

function material(cambios: Partial<MaterialOrden> = {}): MaterialOrden {
  return {
    id: 'mat-1',
    ordenId: OP_ID,
    tipo: 'MP',
    descripcion: 'Acero',
    cantidad: '2.0000',
    unidad: 'kg',
    costoUnitarioCotizado: '32.8250',
    costoUnitarioReal: '50.0000',
    nroRemito: null,
    nroFactura: null,
    nt: null,
    po: null,
    ...cambios,
  };
}

function contexto(materiales: readonly MaterialOrden[] = [material()], valorHora = '32.8250') {
  const falso = crearDependenciasFalsas({
    ops: [crearOrden({ numeroOp: 'OT-1001', montoVendido: '1000.00' })],
    etapas: crearEtapas(['Corte', 'Soldadura']),
    horas: [crearRegistroHora({ etapaId: `${OP_ID}-etapa-1`, horas: '2.50' })],
    clientes: [crearCliente({ nombre: 'ACME S.A.' })],
    configuracion: crearConfiguracion({ valorHoraEstandar: valorHora }),
  });
  const dependencias: DependenciasApi = {
    ...falso.dependencias,
    materiales: { ...falso.dependencias.materiales, listarPorOrden: async () => materiales },
  };
  return { dependencias, estado: falso.estado };
}

function entradaEsperada(
  materiales: readonly MaterialOrden[],
  valorHora: string,
  incluirMargenes: boolean,
): EntradaModeloPlanilla {
  const etapas = crearEtapas(['Corte', 'Soldadura']);
  return {
    cliente: 'ACME S.A.',
    numeroOp: 'OT-1001',
    materiales: materiales.map(
      ({
        tipo,
        descripcion,
        cantidad,
        unidad,
        costoUnitarioCotizado,
        costoUnitarioReal,
      }) => ({
        tipo,
        descripcion,
        cantidad,
        unidad,
        costoUnitarioCotizado,
        costoUnitarioReal,
      }),
    ),
    horasVendidas: '4.00',
    horasReales: '2.50',
    valorHora,
    montoVendido: '1000.00',
    comparativa: comparativaPorEtapa({
      etapas: etapas.map(({ id, nombre, horasVendidas }) => ({ id, nombre, horasVendidas })),
      partes: [{ etapaId: `${OP_ID}-etapa-1`, horas: '2.50' }],
      avance: 0,
    }),
    incluirMargenes,
  };
}

describe('caso de uso exportOp con puertos en memoria', () => {
  it('4.1 carga OP, etapas, horas, materiales, cliente y tasa y delega en el dominio', async () => {
    const { dependencias, estado } = contexto();
    const modelo = await exportOp(dependencias, OP_ID, { incluirMargenes: true });

    expect(modelo).toEqual(construirModeloPlanilla(entradaEsperada([material()], '32.8250', true)));
    expect(estado.consultas).toContain(`op:${OP_ID}`);
    expect(estado.escrituras).toEqual([]);
  });

  it('4.1 TRANS: con otro tipo, unidad nula y dos partes de horas conserva los datos semánticos', async () => {
    const otroMaterial = material({
      tipo: 'TERCERIZADOS',
      descripcion: 'Rectificado',
      cantidad: '1.2345',
      unidad: null,
      costoUnitarioCotizado: '10.0000',
      costoUnitarioReal: null,
    });
    const { dependencias } = contexto([otroMaterial], '0.00');
    const modelo = await exportOp(dependencias, OP_ID, { incluirMargenes: true });

    expect(modelo?.variante).toBe('costeo');
    expect(modelo?.cliente).toBe('ACME S.A.');
    expect(modelo?.horasVendidas).toBe('4.00');
    expect(modelo?.horasReales).toBe('2.50');
    expect(modelo?.valorHora).toBe('0.00');
    if (modelo?.variante !== 'costeo') throw new Error('se esperaba la variante de costeo');
    expect(modelo.materiales[0]).toMatchObject({
      tipo: 'TERCERIZADOS',
      descripcion: 'Rectificado',
      cantidad: '1.2345',
      unidad: null,
      costoUnitarioReal: null,
    });
    const costoReal = costoMaterialReal([otroMaterial]);
    expect(modelo.costos.costoMaterialesReal).toBe(costoReal);
    expect(modelo.margenReal).toBe(
      margenReal({
        montoVendido: '1000.00',
        horasRealesTotales: '2.50',
        costoMaterialesReal: costoReal,
        valorHoraEstandar: '0.00',
      }),
    );
  });

  it('4.2 respeta incluirMargenes: false usando el mismo constructor del dominio', async () => {
    const { dependencias } = contexto();
    const modelo = await exportOp(dependencias, OP_ID, { incluirMargenes: false });

    expect(modelo).toEqual(construirModeloPlanilla(entradaEsperada([material()], '32.8250', false)));
    expect(modelo?.variante).toBe('operativa');
    expect(modelo).not.toHaveProperty('costos');
    expect(modelo).not.toHaveProperty('margenReal');
  });

  it('4.2 TRANS sin materiales y tasa 0.00 conserva la variante operativa sin importes', async () => {
    const { dependencias } = contexto([], '0.00');
    const modelo = await exportOp(dependencias, OP_ID, { incluirMargenes: false });

    expect(modelo).toEqual(construirModeloPlanilla(entradaEsperada([], '0.00', false)));
    expect(modelo?.materiales).toEqual([]);
  });

  it('4.3 una OP inexistente devuelve null sin leer etapas, horas, materiales, cliente ni tasa', async () => {
    const falso = crearDependenciasFalsas({ ops: [] });
    const prohibido = async (): Promise<never> => {
      throw new Error('no se debió consultar otra fuente para una OP inexistente');
    };
    const dependencias: DependenciasApi = {
      ...falso.dependencias,
      etapas: { ...falso.dependencias.etapas, listarPorOrden: prohibido },
      horas: { ...falso.dependencias.horas, listarPorOrden: prohibido },
      materiales: { ...falso.dependencias.materiales, listarPorOrden: prohibido },
      clientes: { ...falso.dependencias.clientes, buscarPorId: prohibido },
      configuracion: { ...falso.dependencias.configuracion, obtener: prohibido },
    };

    await expect(
      exportOp(dependencias, 'op-inexistente', { incluirMargenes: true }),
    ).resolves.toBeNull();
  });

  it('4.3 TRANS con tasa global 0.00 el margen sigue siendo exacto y sin tarifa inventada', async () => {
    const { dependencias } = contexto([material()], '0.00');
    const modelo = await exportOp(dependencias, OP_ID, { incluirMargenes: true });

    if (modelo?.variante !== 'costeo') throw new Error('se esperaba la variante de costeo');
    const costoReal = costoMaterialReal([material()]);
    expect(modelo.valorHora).toBe('0.00');
    expect(modelo.costos.costoMaterialesReal).toBe(costoReal);
    expect(modelo.margenReal).toBe(
      margenReal({
        montoVendido: '1000.00',
        horasRealesTotales: '2.50',
        costoMaterialesReal: costoReal,
        valorHoraEstandar: '0.00',
      }),
    );
  });
});
