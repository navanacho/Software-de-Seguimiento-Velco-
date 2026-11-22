import { describe, expect, it } from 'vitest';
import { normalizarCodigoPlano } from './codigo-plano.ts';

describe('normalizarCodigoPlano', () => {
  it('RN-OP-06: aplica trim, mayúsculas y convierte vacío a null', () => {
    expect(normalizarCodigoPlano('  pl-2026-045  ')).toBe('PL-2026-045');
    expect(normalizarCodigoPlano('')).toBeNull();
  });

  it('RN-OP-06 TRIANGULA: conserva normalizado, trata espacios y ausente como null', () => {
    expect(normalizarCodigoPlano('PL-2026-045')).toBe('PL-2026-045');
    expect(normalizarCodigoPlano('   ')).toBeNull();
    expect(normalizarCodigoPlano(undefined)).toBeNull();
    expect(normalizarCodigoPlano(null)).toBeNull();
  });
});
