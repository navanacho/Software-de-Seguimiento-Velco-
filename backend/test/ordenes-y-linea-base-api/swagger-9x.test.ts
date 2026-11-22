import { describe, expect, it } from 'vitest';
import { buildApp } from '../../src/features/salud/http/app.ts';
import { configuracionPrueba, crearDependenciasFalsas } from '../tablero-read-api/fixtures.ts';

describe('swagger 9.4', () => {
  it('documenta placeholder codigoPlano y contratos 409', async () => {
    const { dependencias } = crearDependenciasFalsas();
    const app = await buildApp(configuracionPrueba(), dependencias);
    try {
      await app.ready();
      const spec = app.swagger() as any;
      const postOps = spec.paths['/api/ops']?.post;
      expect(JSON.stringify(postOps)).toContain('Opcional — Ej: PL-2026-045');
      expect(JSON.stringify(postOps?.responses?.['409'] ?? {})).toContain('codigo_plano_duplicado');
      const putOps = spec.paths['/api/ops/{id}']?.put;
      expect(JSON.stringify(putOps?.responses?.['409'] ?? {})).toContain('numero_op_duplicado');
    } finally { await app.close(); }
  });
});
