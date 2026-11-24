import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ConfiguracionPage } from './ConfiguracionPage.tsx';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function respuestaJson(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), { status, headers: { 'content-type': 'application/json' } });
}

const CONFIGURACION = {
  id: 1,
  valorHoraEstandar: '1250.50',
  diasAlertaRiesgo: 3,
  porcentajeAvanceRiesgo: 80,
  etapasDefault: ['Corte', 'Soldadura', 'Entrega'],
};

function renderPagina(put = respuestaJson(CONFIGURACION)) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const fetchMock = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
    if (init?.method === 'PUT') return put;
    return respuestaJson(CONFIGURACION);
  });
  globalThis.fetch = fetchMock;
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/configuracion']}>
        <ConfiguracionPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { fetchMock, queryClient: qc };
}

describe('ConfiguracionPage (HU-18, Flujo 7)', () => {
  it('carga la configuración desde GET y muestra avisos de tasa y plantilla', async () => {
    renderPagina();
    expect(await screen.findByDisplayValue('1250.50')).toBeDefined();
    expect(screen.getByLabelText(/días de alerta/i)).toHaveProperty('value', '3');
    expect(screen.getByLabelText(/% de avance de riesgo/i)).toHaveProperty('value', '80');
    expect(screen.getByDisplayValue('Corte')).toBeDefined();
    expect(screen.getByText(/márgenes se recalculan con la tasa vigente/i)).toBeDefined();
    expect(screen.getByText(/OPs existentes conservan su ruta/i)).toBeDefined();
    expect(screen.queryByText(/selector de rol/i)).toBeNull();
  });

  it('guarda la representación completa y confirma el éxito', async () => {
    const { fetchMock } = renderPagina();
    await screen.findByDisplayValue('1250.50');
    fireEvent.change(screen.getByLabelText(/días de alerta/i), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar configuración/i }));
    await waitFor(() => expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'PUT')).toBe(true));
    await waitFor(() => expect(screen.getByText(/configuración guardada/i)).toBeDefined());
    const llamada = fetchMock.mock.calls.find(([, init]) => init?.method === 'PUT')!;
    expect(String(llamada[0])).toBe('/api/configuracion');
    expect(JSON.parse(String(llamada[1]?.body))).toEqual({
      valorHoraEstandar: '1250.50',
      diasAlertaRiesgo: 5,
      porcentajeAvanceRiesgo: 80,
      etapasDefault: ['Corte', 'Soldadura', 'Entrega'],
    });
  });

  it('muestra los errores 422 junto a su campo sin afirmar guardado', async () => {
    const error = respuestaJson({
      error: 'validation_error',
      message: 'datos inválidos en la solicitud',
      details: [{ path: 'porcentajeAvanceRiesgo', message: 'Debe ser un entero entre 0 y 100' }],
    }, 422);
    renderPagina(error);
    await screen.findByDisplayValue('1250.50');
    fireEvent.click(screen.getByRole('button', { name: /guardar configuración/i }));
    await waitFor(() => expect(screen.getByText('Debe ser un entero entre 0 y 100')).toBeDefined());
    expect(screen.queryByText(/configuración guardada/i)).toBeNull();
  });

  it('rechaza localmente porcentaje fuera de rango sin enviar PUT', async () => {
    const { fetchMock } = renderPagina();
    await screen.findByDisplayValue('1250.50');
    fireEvent.change(screen.getByLabelText(/% de avance de riesgo/i), { target: { value: '101' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar configuración/i }));
    expect(await screen.findByText('Debe ser un entero entre 0 y 100')).toBeDefined();
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'PUT')).toBe(false);
  });

  it('rechaza plantilla duplicada ignorando mayúsculas sin enviar PUT', async () => {
    const { fetchMock } = renderPagina();
    await screen.findByDisplayValue('1250.50');
    const etapas = screen.getAllByLabelText(/etapa \d+/i);
    fireEvent.change(etapas[1]!, { target: { value: 'CORTE' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar configuración/i }));
    expect(await screen.findByText('El nombre de la etapa está duplicado')).toBeDefined();
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'PUT')).toBe(false);
  });

  it('invalida configuración, tablero y detalle tras guardar y repinta', async () => {
    const { fetchMock, queryClient } = renderPagina();
    const invalidar = vi.spyOn(queryClient, 'invalidateQueries');
    await screen.findByDisplayValue('1250.50');
    fireEvent.click(screen.getByRole('button', { name: /guardar configuración/i }));
    await waitFor(() => expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'PUT')).toBe(true));
    expect(await screen.findByText(/configuración guardada/i)).toBeDefined();
    await waitFor(() => {
      const claves = invalidar.mock.calls.map(([opciones]) => opciones?.queryKey);
      expect(claves).toEqual(expect.arrayContaining([['configuracion'], ['tablero'], ['orden']]));
    });
  });
});
