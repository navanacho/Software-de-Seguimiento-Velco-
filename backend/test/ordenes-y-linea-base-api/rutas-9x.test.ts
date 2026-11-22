import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { buildApp } from '../../src/features/salud/http/app.ts';
import { configuracionPrueba, crearDependenciasFalsas, crearOrden } from '../tablero-read-api/fixtures.ts';

describe('rutas 9.x', () => {
  it('9.1 expone los siete endpoints C-06', async () => {
    const opId = randomUUID();
    const etapaId = randomUUID();
    const { dependencias } = crearDependenciasFalsas({ ops: [crearOrden({ id: opId, numeroOp: 'OP-1' })], etapas: [{ id: etapaId, ordenId: opId, nombre: 'Corte', ordenSecuencia: 1, completada: false, horasVendidas: '0.00' }] });
    const app = await buildApp(configuracionPrueba(), dependencias);
    try {
      const postOp = await app.inject({ method: 'POST', url: '/api/ops', payload: { numeroOp: 'OP-N', codigoPlano: 'PL-1', clienteNombre: 'C', descripcionPieza: 'P', fechaEntrega: '2027-01-01', montoVendido: '10.00', observaciones: null, materiales: [], etapas: [] } });
      expect(postOp.statusCode).toBe(201);
      const putOp = await app.inject({ method: 'PUT', url: `/api/ops/${opId}`, payload: { numeroOp: 'OP-1', codigoPlano: null, clienteNombre: 'C', descripcionPieza: 'P2', fechaEntrega: '2027-01-01', montoVendido: '10.00', observaciones: null } });
      expect(putOp.statusCode).toBe(200);
      const postCli = await app.inject({ method: 'POST', url: '/api/clientes', payload: { nombre: 'Nuevo' } });
      expect([200,201]).toContain(postCli.statusCode);
      const postEt = await app.inject({ method: 'POST', url: `/api/ops/${opId}/etapas`, payload: { nombre: 'Nueva', horasVendidas: '0.00' } });
      expect([200,201]).toContain(postEt.statusCode);
      const patchOrden = await app.inject({ method: 'PATCH', url: `/api/ops/${opId}/etapas/${etapaId}/orden`, payload: { ordenSecuencia: 1 } });
      expect([200,204]).toContain(patchOrden.statusCode);
      const delEt = await app.inject({ method: 'DELETE', url: `/api/ops/${opId}/etapas/${etapaId}` });
      expect([200,204]).toContain(delEt.statusCode);
      const postMat = await app.inject({ method: 'POST', url: `/api/ops/${opId}/materiales`, payload: { tipo: 'MP', descripcion: 'A', cantidad: '1', costoUnitarioCotizado: '1.00' } });
      expect(postMat.statusCode).toBe(201);
    } finally { await app.close(); }
  });
});
