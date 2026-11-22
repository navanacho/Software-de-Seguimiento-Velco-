import { describe, expect, it } from 'vitest';
import { listarOps } from '../../src/features/ordenes/application/listarOps.ts';
import { crearCliente, crearDependenciasFalsas, crearEtapas, crearOrden } from '../tablero-read-api/fixtures.ts';

describe('C-06 listarOps búsqueda y conPlano', () => {
  it('8.1 busca por codigoPlano y clienteNombre case-insensitive', async () => {
    const { dependencias } = crearDependenciasFalsas({
      ops: [
        crearOrden({ id: 'op-1', numeroOp: 'OT-1', codigoPlano: 'PL-2026-045', clienteId: 'cli-1', descripcionPieza: 'Eje' }),
        crearOrden({ id: 'op-2', numeroOp: 'OT-2', codigoPlano: null, clienteId: 'cli-2', descripcionPieza: 'Tapa' }),
      ],
      etapas: [...crearEtapas(['Corte'], 'op-1'), ...crearEtapas(['Corte'], 'op-2')],
      clientes: [crearCliente({ id: 'cli-1', nombre: 'Agroindustria Cuyo' }), crearCliente({ id: 'cli-2', nombre: 'Cliente Sur' })],
    });
    const porPlano = await listarOps(dependencias, { buscar: 'pl-2026-045' });
    expect(porPlano.ops.map((o) => o.numeroOp)).toEqual(['OT-1']);
    const porCliente = await listarOps(dependencias, { buscar: 'agro' });
    expect(porCliente.ops.map((o) => o.numeroOp)).toEqual(['OT-1']);
  });

  it('8.3 TRIANGULA: null no da falso positivo y busca por numeroOp', async () => {
    const { dependencias } = crearDependenciasFalsas({
      ops: [
        crearOrden({ id: 'op-1', numeroOp: 'OT-1871', codigoPlano: null, clienteId: 'cli-1', descripcionPieza: 'Eje' }),
        crearOrden({ id: 'op-2', numeroOp: 'OT-2', codigoPlano: 'PL-X', clienteId: 'cli-1', descripcionPieza: 'Tapa' }),
      ],
      etapas: [...crearEtapas(['Corte'], 'op-1'), ...crearEtapas(['Corte'], 'op-2')],
      clientes: [crearCliente({ id: 'cli-1', nombre: 'Norte' })],
    });
    expect((await listarOps(dependencias, { buscar: 'PL-' })).ops.map((o) => o.numeroOp)).toEqual(['OT-2']);
    expect((await listarOps(dependencias, { buscar: '1871' })).ops.map((o) => o.numeroOp)).toEqual(['OT-1871']);
  });
});
