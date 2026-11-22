import { describe, expect, it } from 'vitest';
import { buildApp } from '../../src/features/salud/http/app.ts';
import { configuracionPrueba } from '../tablero-read-api/fixtures.ts';
import { crearDependenciasFalsas, crearOrden } from '../tablero-read-api/fixtures.ts';
import { randomUUID } from 'node:crypto';

describe('rutas 9.x triangulación', () => {
  it('9.3 POST/PUT OP 422 y 409 cuerpos exactos', async () => {
    const id = randomUUID();
    const { dependencias } = crearDependenciasFalsas({ ops: [crearOrden({ id, numeroOp: 'OP-1', codigoPlano: 'PL-1' }), crearOrden({ id: randomUUID(), numeroOp: 'OP-2', codigoPlano: 'PL-2' })] });
    const app = await buildApp(configuracionPrueba(), dependencias);
    try {
      const bad = await app.inject({ method: 'POST', url: '/api/ops', payload: { numeroOp: '', clienteNombre: 'C', descripcionPieza: 'P', fechaEntrega: '2027-01-01', montoVendido: '1.00', materiales: [] } });
      expect(bad.statusCode).toBe(422);
      const dupNum = await app.inject({ method: 'PUT', url: `/api/ops/${id}`, payload: { numeroOp: 'OP-2', codigoPlano: null, clienteNombre: 'C', descripcionPieza: 'P', fechaEntrega: '2027-01-01', montoVendido: '1.00', observaciones: null } });
      expect(dupNum.statusCode).toBe(409);
      expect(dupNum.json()).toMatchObject({ error: 'numero_op_duplicado', numeroOp: 'OP-2' });
      expect(dupNum.json()).not.toHaveProperty('opExistente');
    } finally { await app.close(); }
  });
});
