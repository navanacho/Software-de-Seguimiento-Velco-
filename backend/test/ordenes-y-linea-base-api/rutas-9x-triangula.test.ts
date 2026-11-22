import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { buildApp } from '../../src/features/salud/http/app.ts';
import { configuracionPrueba, crearDependenciasFalsas, crearOrden } from '../tablero-read-api/fixtures.ts';

describe('rutas 9.x triangulación rutas', () => {
  it('9.3 triangula 404/422 en rutas restantes', async () => {
    const opId = randomUUID();
    const etapaId = randomUUID();
    const { dependencias } = crearDependenciasFalsas({ ops: [crearOrden({ id: opId, numeroOp: 'OP-1' })], etapas: [{ id: etapaId, ordenId: opId, nombre: 'Corte', ordenSecuencia: 1, completada: false, horasVendidas: '0.00' }] });
    const app = await buildApp(configuracionPrueba(), dependencias);
    try {
      expect((await app.inject({ method: 'PUT', url: `/api/ops/${randomUUID()}`, payload: { numeroOp: 'X', codigoPlano: null, clienteNombre: 'C', descripcionPieza: 'P', fechaEntrega: '2027-01-01', montoVendido: '1.00', observaciones: null } })).statusCode).toBe(404);
      expect((await app.inject({ method: 'POST', url: `/api/ops/${randomUUID()}/etapas`, payload: { nombre: 'N' } })).statusCode).toBe(404);
      expect((await app.inject({ method: 'DELETE', url: `/api/ops/${opId}/etapas/${randomUUID()}` })).statusCode).toBe(404);
      expect((await app.inject({ method: 'POST', url: `/api/ops/${opId}/materiales`, payload: { tipo: 'MP', descripcion: '', cantidad: '1', costoUnitarioCotizado: '1.00' } })).statusCode).toBe(422);
    } finally { await app.close(); }
  });
});
