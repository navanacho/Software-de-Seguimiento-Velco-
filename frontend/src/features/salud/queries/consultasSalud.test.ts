import { RUTA_SALUD } from '@velco/domain';
import { describe, expect, it } from 'vitest';
import { consultarSalud } from './consultasSalud.ts';

describe('query de salud por feature', () => {
  it('consulta la ruta del contrato compartido y valida la respuesta', async () => {
    const urls: string[] = [];
    const resultado = await consultarSalud(async (url) => {
      urls.push(url);
      return { ok: true, json: async () => ({ estado: 'ok' }) };
    });
    expect(urls).toEqual([RUTA_SALUD]);
    expect(resultado).toEqual({ estado: 'ok' });
  });

  it('falla cuando el servicio responde un error', async () => {
    await expect(
      consultarSalud(async () => ({ ok: false, json: async () => ({ estado: 'ok' }) })),
    ).rejects.toThrow('No se pudo consultar el estado del servicio');
  });
});
