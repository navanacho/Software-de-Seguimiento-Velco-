import { describe, expect, it } from 'vitest';
import { buildApp, iniciarServidor } from './app.ts';

describe('GET /api/health', () => {
  it('responde 200 con estado ok y refleja el origen CORS configurado', async () => {
    const app = await buildApp({ puerto: 3001, origenCors: 'http://localhost:5173', baseUncExcel: '' });
    try {
      const respuesta = await app.inject({ method: 'GET', url: '/api/health' });
      expect(respuesta.statusCode).toBe(200);
      expect(respuesta.json()).toEqual({ estado: 'ok' });
      expect(respuesta.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    } finally {
      await app.close();
    }
  });

  it('documenta el endpoint con Swagger usando el contrato compartido', async () => {
    const app = await buildApp({ puerto: 3001, origenCors: 'http://localhost:5173', baseUncExcel: '' });
    try {
      const respuesta = await app.inject({ method: 'GET', url: '/documentation/json' });
      expect(respuesta.statusCode).toBe(200);
      const documento = respuesta.json() as { paths: Record<string, unknown> };
      expect(Object.keys(documento.paths)).toContain('/api/health');
    } finally {
      await app.close();
    }
  });

  it('escucha en el puerto indicado por PORT sin cambios de código', async () => {
    const app = await iniciarServidor({ puerto: 0, origenCors: 'http://localhost:5173', baseUncExcel: '' });
    try {
      const direccion = app.server.address();
      if (direccion === null || typeof direccion === 'string') {
        throw new Error('el servidor no exponía una dirección TCP');
      }
      const respuesta = await fetch(`http://127.0.0.1:${direccion.port}/api/health`);
      expect(respuesta.status).toBe(200);
      expect(await respuesta.json()).toEqual({ estado: 'ok' });
    } finally {
      await app.close();
    }
  });
});
