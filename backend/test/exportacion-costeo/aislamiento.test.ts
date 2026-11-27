import { describe, expect, it } from 'vitest';
import { compilarDominioAislado } from './soporte-aislamiento';

describe('aislamiento del dominio de exportacion-costeo', () => {
  it('2.9 compila packages/domain sin adaptadores ni dependencias de framework', () => {
    const resultado = compilarDominioAislado();
    expect(resultado.adaptadoresPresentes).toBe(false);
    expect(resultado.exito).toBe(true);
    expect(resultado.salida).not.toMatch(/error TS/);
  });

  it('2.9 la copia aislada conserva el constructor compartido', () => {
    const resultado = compilarDominioAislado();
    expect(resultado.fuentes).toContain('export function construirModeloPlanilla');
    expect(resultado.fuentes).not.toMatch(/exceljs|from 'fastify'|from 'react'/);
  });
});
