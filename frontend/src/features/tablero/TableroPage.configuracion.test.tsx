import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { TableroPage } from './TableroPage.tsx';
import { crearEnvelope, crearTarjeta } from '../../../test/tablero/fixtures.ts';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function respuestaJson(cuerpo: unknown): Response {
  return new Response(JSON.stringify(cuerpo), { status: 200, headers: { 'content-type': 'application/json' } });
}

function renderTablero(env: ReturnType<typeof crearEnvelope>) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const fetchMock = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => respuestaJson(env));
  globalThis.fetch = fetchMock;
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<TableroPage />} />
          <Route path="/configuracion" element={<p>Destino configuración</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { fetchMock };
}

describe('TableroPage acceso a Configuración (C-10)', () => {
  it('navega desde el encabezado sin recargar el tablero', async () => {
    const env = crearEnvelope({ ops: [crearTarjeta({ id: 'op1', numeroOp: 'OT-1' })] });
    const { fetchMock } = renderTablero(env);
    await screen.findByTestId('kpis-tablero');
    const cantidad = fetchMock.mock.calls.length;

    fireEvent.click(screen.getByRole('button', { name: 'Configuración' }));

    expect(await screen.findByText('Destino configuración')).toBeDefined();
    expect(fetchMock.mock.calls).toHaveLength(cantidad);
  });
});
