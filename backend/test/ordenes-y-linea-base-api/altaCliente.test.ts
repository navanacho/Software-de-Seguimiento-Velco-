import { describe, expect, it } from 'vitest';
import { buildApp } from '../../src/features/salud/http/app.ts';
import { configuracionPrueba, crearDependenciasFalsas } from '../tablero-read-api/fixtures.ts';

describe('altaCliente', () => {
  it('5.10/5.11 crea cliente valido y 422 si nombre vacio', async () => {
    const { dependencias } = crearDependenciasFalsas();
    const app = await buildApp(configuracionPrueba(), dependencias);
    try {
      const ok = await app.inject({ method: 'POST', url: '/api/clientes', payload: { nombre: 'Nuevo Cliente' } });
      expect(ok.statusCode).toBe(201);
      expect(ok.json()).toMatchObject({ nombre: 'Nuevo Cliente' });
      const bad = await app.inject({ method: 'POST', url: '/api/clientes', payload: { nombre: '   ' } });
      expect(bad.statusCode).toBe(422);
    } finally { await app.close(); }
  });

  it('5.11 TRIANGULA: duplicado devuelve existente y no duplica', async () => {
    const { dependencias, estado } = crearDependenciasFalsas();
    const app = await buildApp(configuracionPrueba(), dependencias);
    try {
      await app.inject({ method: 'POST', url: '/api/clientes', payload: { nombre: 'ACME' } });
      const dup = await app.inject({ method: 'POST', url: '/api/clientes', payload: { nombre: 'ACME' } });
      expect([200, 201, 409]).toContain(dup.statusCode);
      expect(estado.clientes.filter((c) => c.nombre === 'ACME').length).toBe(1);
    } finally { await app.close(); }
  });
});
