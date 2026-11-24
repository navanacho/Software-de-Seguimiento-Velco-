import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { OrdenFormPage } from './OrdenFormPage.tsx';
import { crearDetalle } from '../../../test/ordenes/fixtures.ts';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const CONFIGURACION = {
  id: 1,
  valorHoraEstandar: '1000.00',
  diasAlertaRiesgo: 3,
  porcentajeAvanceRiesgo: 80,
  etapasDefault: ['Corte', 'Soldadura', 'Entrega'],
};

function respuestaJson(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), { status, headers: { 'content-type': 'application/json' } });
}

function renderPagina(fallaConfiguracion = false) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const fetchMock = vi.fn(async (url: RequestInfo | URL, _init?: RequestInit) => {
    if (String(url).includes('/api/configuracion')) {
      return fallaConfiguracion
        ? respuestaJson({ error: 'desconocido', message: 'No se pudo cargar la configuración' }, 500)
        : respuestaJson(CONFIGURACION);
    }
    return respuestaJson(crearDetalle(), 201);
  });
  globalThis.fetch = fetchMock;
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/ops/nueva']}>
        <Routes>
          <Route path="/ops/nueva" element={<OrdenFormPage clientes={[{ id: 'c-1', nombre: 'ACME' }]} />} />
          <Route path="/" element={<p>Tablero destino</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { fetchMock };
}

function completarAlta() {
  fireEvent.change(screen.getByLabelText(/n° op/i), { target: { value: '1872' } });
  fireEvent.change(screen.getByLabelText(/^cliente$/i), { target: { value: 'c-1' } });
  fireEvent.change(screen.getByLabelText(/descripción de la pieza/i), { target: { value: 'Eje B' } });
  fireEvent.change(screen.getByLabelText(/fecha de entrega/i), { target: { value: '2026-12-10' } });
  fireEvent.change(screen.getByLabelText(/monto vendido/i), { target: { value: '1500.00' } });
}

function cuerpoDelPost(fetchMock: ReturnType<typeof vi.fn>) {
  const llamada = fetchMock.mock.calls.find(([url, init]) =>
    String(url).includes('/api/ops') && init?.method === 'POST')!;
  return JSON.parse(String(llamada[1]?.body)) as Record<string, unknown>;
}

describe('OrdenFormPage precarga desde configuración global (C-10)', () => {
  it('precarga la plantilla desde GET /api/configuracion', async () => {
    const { fetchMock } = renderPagina();
    await waitFor(() => expect((screen.getByLabelText('Etapa 3') as HTMLInputElement).value).toBe('Entrega'));
    expect(screen.queryByLabelText('Etapa 5')).toBeNull();
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/api/configuracion'))).toBe(true);
  });

  it('usa la plantilla canónica cuando falla la lectura de configuración', async () => {
    const { fetchMock } = renderPagina(true);
    await waitFor(() => expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/api/configuracion'))).toBe(true));
    expect((screen.getByLabelText('Etapa 5') as HTMLInputElement).value).toBe('Entrega');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('omite etapas en el POST cuando la plantilla precargada no se modifica', async () => {
    const { fetchMock } = renderPagina();
    await waitFor(() => expect((screen.getByLabelText('Etapa 3') as HTMLInputElement).value).toBe('Entrega'));
    completarAlta();
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));
    await waitFor(() => expect(screen.getByText('Tablero destino')).toBeDefined());
    expect(cuerpoDelPost(fetchMock).etapas).toBeUndefined();
  });

  it('envía las etapas explícitas cuando se edita la plantilla precargada', async () => {
    const { fetchMock } = renderPagina();
    await waitFor(() => expect((screen.getByLabelText('Etapa 3') as HTMLInputElement).value).toBe('Entrega'));
    fireEvent.change(screen.getByLabelText('Etapa 1'), { target: { value: 'Corte API' } });
    completarAlta();
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));
    await waitFor(() => expect(screen.getByText('Tablero destino')).toBeDefined());
    expect(cuerpoDelPost(fetchMock).etapas).toEqual([
      { nombre: 'Corte API', horasVendidas: '0.00' },
      { nombre: 'Soldadura', horasVendidas: '0.00' },
      { nombre: 'Entrega', horasVendidas: '0.00' },
    ]);
  });
});
