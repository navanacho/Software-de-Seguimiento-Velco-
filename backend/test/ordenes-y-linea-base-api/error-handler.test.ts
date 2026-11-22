import { describe, expect, it } from 'vitest';
import { buildApp } from '../../src/features/salud/http/app.ts';
import { CodigoPlanoDuplicadoError, NumeroOpDuplicadoError } from '../../src/shared/errores.ts';
import { configuracionPrueba, crearDependenciasFalsas } from '../tablero-read-api/fixtures.ts';

describe('error handler C-06', () => {
  it('4.3 mapea CodigoPlanoDuplicadoError a 409 con cuerpo exacto', async () => {
    const { dependencias } = crearDependenciasFalsas();
    const app = await buildApp(configuracionPrueba(), dependencias);
    app.get('/__test__/plano', async () => {
      throw new CodigoPlanoDuplicadoError('PL-2026-045', { id: 'op-1', numeroOp: '1871' });
    });
    try {
      const res = await app.inject({ method: 'GET', url: '/__test__/plano' });
      expect(res.statusCode).toBe(409);
      expect(res.json()).toEqual({
        error: 'codigo_plano_duplicado',
        message: 'El ID de plano PL-2026-045 ya está asignado a la OP 1871.',
        codigoPlano: 'PL-2026-045',
        opExistente: { id: 'op-1', numeroOp: '1871' },
      });
    } finally {
      await app.close();
    }
  });

  it('4.4 TRIANGULA: NumeroOpDuplicadoError a 409 sin opExistente', async () => {
    const { dependencias } = crearDependenciasFalsas();
    const app = await buildApp(configuracionPrueba(), dependencias);
    app.get('/__test__/numero', async () => {
      throw new NumeroOpDuplicadoError('1871');
    });
    try {
      const res = await app.inject({ method: 'GET', url: '/__test__/numero' });
      expect(res.statusCode).toBe(409);
      expect(res.json()).toEqual({
        error: 'numero_op_duplicado',
        message: 'El número de OP 1871 ya existe.',
        numeroOp: '1871',
      });
    } finally {
      await app.close();
    }
  });
});
