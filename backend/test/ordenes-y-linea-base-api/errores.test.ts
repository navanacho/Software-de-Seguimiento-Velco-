import { describe, expect, it } from 'vitest';
import { CodigoPlanoDuplicadoError, NumeroOpDuplicadoError } from '../../src/shared/errores.ts';

describe('errores C-06', () => {
  it('4.3 CodigoPlanoDuplicadoError expone cuerpo exacto', () => {
    const error = new CodigoPlanoDuplicadoError('PL-2026-045', { id: 'op-1', numeroOp: '1871' });
    expect(error).toMatchObject({
      name: 'CodigoPlanoDuplicadoError',
      statusCode: 409,
      body: {
        error: 'codigo_plano_duplicado',
        message: 'El ID de plano PL-2026-045 ya está asignado a la OP 1871.',
        codigoPlano: 'PL-2026-045',
        opExistente: { id: 'op-1', numeroOp: '1871' },
      },
    });
  });

  it('4.4 NumeroOpDuplicadoError TRIANGULA cuerpo exacto sin opExistente', () => {
    const error = new NumeroOpDuplicadoError('1871');
    expect(error.statusCode).toBe(409);
    expect(error.body).toEqual({
      error: 'numero_op_duplicado',
      message: 'El número de OP 1871 ya existe.',
      numeroOp: '1871',
    });
    expect(error.body).not.toHaveProperty('opExistente');
  });
});
