import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
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
          <Route path="/ops/nueva" element={<p>Formulario destino</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { fetchMock };
}

describe('TableroPage acceso a Nueva OP (sección 6.8-6.10)', () => {
  it('navega desde la barra sin pedir el listado otra vez (T1)', async () => {
    const env = crearEnvelope({ ops: [crearTarjeta({ id: 'op1', numeroOp: 'OT-1' })] });
    const { fetchMock } = renderTablero(env);
    await screen.findByTestId('kpis-tablero');
    fireEvent.change(screen.getByLabelText(/buscar/i), { target: { value: 'OT-1' } });
    await waitFor(() => expect(fetchMock.mock.calls.some((c) => String(c[0]).includes('buscar=OT-1'))).toBe(true));
    const cantidad = fetchMock.mock.calls.length;

    fireEvent.click(screen.getByRole('button', { name: 'Nueva OP' }));

    expect(await screen.findByText('Formulario destino')).toBeDefined();
    expect(fetchMock.mock.calls).toHaveLength(cantidad);
  });

  it('muestra Nueva OP en el estado vacío y navega sin recargar el tablero (T2)', async () => {
    const vacio = crearEnvelope({ ops: [], kpis: { total: 0, porEstado: { Terminado: 0, Atrasado: 0, 'En riesgo': 0, 'En plazo': 0 } }, flujo: [] });
    const { fetchMock } = renderTablero(vacio);
    await screen.findByTestId('estado-vacio-tablero');
    const acciones = screen.getAllByRole('button', { name: 'Nueva OP' });
    expect(acciones).toHaveLength(2);
    const cantidad = fetchMock.mock.calls.length;

    fireEvent.click(acciones[1]!);

    expect(await screen.findByText('Formulario destino')).toBeDefined();
    expect(fetchMock.mock.calls).toHaveLength(cantidad);
  });

  it('con resultados no muestra el estado vacío (T3)', async () => {
    const env = crearEnvelope({ ops: [crearTarjeta({ id: 'op1', numeroOp: 'OT-1' })] });
    renderTablero(env);
    await screen.findByTestId('grilla-tarjetas');
    expect(screen.queryByTestId('estado-vacio-tablero')).toBeNull();
  });
});
