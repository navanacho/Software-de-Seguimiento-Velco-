import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { App } from './App.tsx';
import { crearDetalle } from '../../test/ordenes/fixtures.ts';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function respuestaJson(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), { status, headers: { 'content-type': 'application/json' } });
}

describe('App rutas de OP (spec formulario-ordenes y detalle-op-ui)', () => {
  it('exponer /ops/nueva sin autenticación', () => {
    render(<App rutaInicial="/ops/nueva" />);
    expect(screen.getByTestId('formulario-orden-page')).toBeDefined();
  });

  it('exponer /ops/:id/editar cargando la OP existente', async () => {
    globalThis.fetch = vi.fn(async () => respuestaJson(crearDetalle()));
    render(<App rutaInicial="/ops/op-1/editar" />);
    expect(await screen.findByTestId('formulario-orden-page')).toBeDefined();
    await waitFor(() => expect((screen.getByLabelText(/n° op/i) as HTMLInputElement).value).toBe('1871'));
  });

  it('exponer /ops/:id con el detalle de solo lectura', async () => {
    globalThis.fetch = vi.fn(async () => respuestaJson(crearDetalle()));
    render(<App rutaInicial="/ops/op-1" />);
    expect(await screen.findByTestId('detalle-op-page')).toBeDefined();
  });
});
