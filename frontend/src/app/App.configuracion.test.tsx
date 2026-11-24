import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function respuestaJson(cuerpo: unknown): Response {
  return new Response(JSON.stringify(cuerpo), { status: 200, headers: { 'content-type': 'application/json' } });
}

describe('App ruta /configuracion', () => {
  it('monta la vista de configuración global', async () => {
    globalThis.fetch = vi.fn(async () => respuestaJson({
      id: 1,
      valorHoraEstandar: '1250.50',
      diasAlertaRiesgo: 3,
      porcentajeAvanceRiesgo: 80,
      etapasDefault: ['Corte', 'Soldadura', 'Entrega'],
    }));
    render(<App rutaInicial="/configuracion" />);
    expect(await screen.findByTestId('configuracion-page')).toBeDefined();
    expect(screen.getByRole('heading', { name: 'Configuración global' })).toBeDefined();
  });
});
