import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom';
import { OrdenFormPage } from './OrdenFormPage.tsx';
import { crearDetalle, crearEtapaDetalle } from '../../../test/ordenes/fixtures.ts';
import type { EtapaDetalleDTO } from '../../shared/domain-client/tipos.ts';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function respuestaJson(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), { status, headers: { 'content-type': 'application/json' } });
}

function etapasCanonicas(): EtapaDetalleDTO[] {
  return [
    crearEtapaDetalle({ id: 'e-1', nombre: 'Corte', ordenSecuencia: 1, horasVendidas: '7.50' }),
    crearEtapaDetalle({ id: 'e-2', nombre: 'Soldadura', ordenSecuencia: 2, horasVendidas: '0.00' }),
    crearEtapaDetalle({ id: 'e-3', nombre: 'Mecanizado', ordenSecuencia: 3, horasVendidas: '7.50' }),
    crearEtapaDetalle({ id: 'e-4', nombre: 'Pintura', ordenSecuencia: 4, horasVendidas: '0.00' }),
    crearEtapaDetalle({ id: 'e-5', nombre: 'Entrega', ordenSecuencia: 5, horasVendidas: '0.00' }),
  ];
}

function servidorConEtapas(iniciales: EtapaDetalleDTO[]) {
  let etapas = [...iniciales];
  const fetchMock = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    const destino = String(url);
    if (destino.endsWith('/etapas') && init?.method === 'POST') {
      const cuerpo = JSON.parse(String(init.body)) as { nombre: string; horasVendidas: string };
      etapas = [
        ...etapas,
        crearEtapaDetalle({
          id: `e-${etapas.length + 1}`,
          nombre: cuerpo.nombre,
          ordenSecuencia: etapas.length + 1,
          horasVendidas: cuerpo.horasVendidas,
        }),
      ];
      return respuestaJson({ ok: true }, 201);
    }
    if (destino.includes('/etapas/') && destino.endsWith('/orden') && init?.method === 'PATCH') {
      const etapaId = destino.split('/').at(-2)!;
      const cuerpo = JSON.parse(String(init.body)) as { ordenSecuencia: number };
      const indice = etapas.findIndex((etapa) => etapa.id === etapaId);
      const [movida] = etapas.splice(indice, 1);
      if (movida) etapas.splice(cuerpo.ordenSecuencia - 1, 0, movida);
      return respuestaJson({ ok: true });
    }
    if (destino.includes('/etapas/') && init?.method === 'DELETE') {
      const etapaId = destino.split('/').at(-1)!;
      etapas = etapas.filter((etapa) => etapa.id !== etapaId);
      return new Response(null, { status: 204 });
    }
    return respuestaJson(crearDetalle({ etapas }));
  });
  return { fetchMock, etapas: () => etapas };
}

function RutaEditar() {
  const { id = '' } = useParams();
  return <OrdenFormPage ordenId={id} />;
}

function renderPage(ruta: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[ruta]}>
        <Routes>
          <Route path="/ops/nueva" element={<OrdenFormPage clientes={[{ id: 'c-1', nombre: 'ACME' }]} />} />
          <Route path="/ops/:id/editar" element={<RutaEditar />} />
          <Route path="/" element={<p>Tablero destino</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return qc;
}

function completarAlta() {
  fireEvent.change(screen.getByLabelText(/n° op/i), { target: { value: '1872' } });
  fireEvent.change(screen.getByLabelText(/^cliente$/i), { target: { value: 'c-1' } });
  fireEvent.change(screen.getByLabelText(/descripción de la pieza/i), { target: { value: 'Eje B' } });
  fireEvent.change(screen.getByLabelText(/fecha de entrega/i), { target: { value: '2026-12-10' } });
  fireEvent.change(screen.getByLabelText(/monto vendido/i), { target: { value: '1500.00' } });
}

describe('OrdenFormPage editor de etapas (sección 5, D5)', () => {
  it('envía la colección modificada en alta y omite etapas si no se toca (T1)', async () => {
    const fetchMock = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => respuestaJson(crearDetalle(), 201));
    globalThis.fetch = fetchMock;
    renderPage('/ops/nueva');
    completarAlta();
    fireEvent.click(screen.getAllByRole('button', { name: /quitar/i })[3]!);
    fireEvent.change(screen.getByLabelText('Nueva etapa'), { target: { value: 'Control' } });
    fireEvent.click(screen.getByRole('button', { name: /agregar etapa/i }));
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => expect(screen.getByText('Tablero destino')).toBeDefined());
    const llamada = fetchMock.mock.calls.find(([url, init]) => String(url) === '/api/ops' && init?.method === 'POST')!;
    const cuerpo = JSON.parse(String(llamada[1]?.body)) as { etapas: readonly { nombre: string; horasVendidas: string }[] };
    expect(cuerpo.etapas.map((etapa) => etapa.nombre)).toEqual(['Corte', 'Soldadura', 'Mecanizado', 'Entrega', 'Control']);
    expect(cuerpo.etapas.every((etapa) => typeof etapa.horasVendidas === 'string')).toBe(true);
  });

  it('persiste alta y baja en la OP existente y repinta con el detalle servido (T2)', async () => {
    const servidor = servidorConEtapas(etapasCanonicas());
    globalThis.fetch = servidor.fetchMock;
    renderPage('/ops/op-1/editar');
    await screen.findByDisplayValue('1871');

    fireEvent.change(screen.getByLabelText('Nueva etapa'), { target: { value: 'Pulido' } });
    fireEvent.click(screen.getByRole('button', { name: /agregar etapa/i }));
    await waitFor(() => expect(screen.getByTestId('nombre-etapa-5').textContent).toBe('Pulido'));
    expect(servidor.fetchMock.mock.calls.some(([url, init]) =>
      String(url) === '/api/ops/op-1/etapas' && init?.method === 'POST')).toBe(true);

    fireEvent.click(screen.getAllByRole('button', { name: /quitar/i })[4]!);
    await waitFor(() => expect(screen.getByTestId('nombre-etapa-4').textContent).toBe('Pulido'));
    expect(servidor.fetchMock.mock.calls.some(([url, init]) =>
      String(url) === '/api/ops/op-1/etapas/e-5' && init?.method === 'DELETE')).toBe(true);
    expect(servidor.etapas().map((etapa) => etapa.nombre)).toEqual(['Corte', 'Soldadura', 'Mecanizado', 'Pintura', 'Pulido']);
  });

  it('rechaza nombres vacíos sin enviar alta (T3)', async () => {
    const servidor = servidorConEtapas(etapasCanonicas());
    globalThis.fetch = servidor.fetchMock;
    renderPage('/ops/op-1/editar');
    await screen.findByDisplayValue('1871');

    fireEvent.click(screen.getByRole('button', { name: /agregar etapa/i }));
    expect(screen.getAllByRole('alert').some((nodo) => /1 y 100 caracteres/.test(nodo.textContent ?? ''))).toBe(true);
    expect(servidor.fetchMock.mock.calls.some(([url, init]) =>
      String(url).endsWith('/etapas') && init?.method === 'POST')).toBe(false);
  });

  it('persiste el reorden con PATCH, reconsulta y conserva horas y derivados (T4)', async () => {
    const servidor = servidorConEtapas(etapasCanonicas());
    globalThis.fetch = servidor.fetchMock;
    const qc = renderPage('/ops/op-1/editar');
    await screen.findByDisplayValue('1871');
    const invalidar = vi.spyOn(qc, 'invalidateQueries');

    fireEvent.click(screen.getByRole('button', { name: 'Mover Mecanizado al inicio' }));

    await waitFor(() => expect(screen.getByTestId('nombre-etapa-0').textContent).toBe('Mecanizado'));
    const llamada = servidor.fetchMock.mock.calls.find(([url, init]) =>
      String(url) === '/api/ops/op-1/etapas/e-3/orden' && init?.method === 'PATCH')!;
    expect(JSON.parse(String(llamada[1]?.body))).toEqual({ ordenSecuencia: 1 });
    expect(invalidar).toHaveBeenCalledWith({ queryKey: ['orden', 'op-1'] });
    expect(screen.getByTestId('horas-etapa-0').textContent).toBe('7.50');
    expect(screen.getByTestId('derivados-etapas').textContent).toContain('Avance: 0%');
    expect(screen.getByTestId('derivados-etapas').textContent).toContain('Etapa actual: Corte');
  });

  it('no ofrece edición de horas persistidas ni las envía al guardar la cabecera (T7)', async () => {
    const servidor = servidorConEtapas(etapasCanonicas());
    globalThis.fetch = servidor.fetchMock;
    renderPage('/ops/op-1/editar');
    await screen.findByDisplayValue('1871');

    expect(screen.queryByLabelText('Horas vendidas 1')).toBeNull();
    expect(screen.getByTestId('horas-etapa-0').textContent).toBe('7.50');

    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));
    await waitFor(() => expect(screen.getByText('Tablero destino')).toBeDefined());

    const actualizaciones = servidor.fetchMock.mock.calls.filter(([url, init]) =>
      String(url) === '/api/ops/op-1' && init?.method === 'PUT');
    expect(actualizaciones).toHaveLength(1);
    const cuerpo = JSON.parse(String(actualizaciones[0]![1]?.body)) as Record<string, unknown>;
    expect(cuerpo.etapas).toBeUndefined();
    expect(servidor.etapas().map((etapa) => etapa.horasVendidas)).toEqual(['7.50', '0.00', '7.50', '0.00', '0.00']);
  });

  it('avisa el fallo del PATCH sin repintar el orden local (T5)', async () => {
    globalThis.fetch = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === 'PATCH') return respuestaJson({ error: 'conflicto', message: 'No se pudo reordenar.' }, 500);
      return respuestaJson(crearDetalle({ etapas: etapasCanonicas() }));
    });
    renderPage('/ops/op-1/editar');
    await screen.findByDisplayValue('1871');

    fireEvent.click(screen.getByRole('button', { name: 'Mover Mecanizado al inicio' }));

    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('No se pudo reordenar.'));
    expect(screen.getByTestId('nombre-etapa-0').textContent).toBe('Corte');
  });

  it.each(['op-a', 'op-b'])('dirige la baja a la OP %s aunque compartan nombres (T6)', async (ordenId) => {
    const servidor = servidorConEtapas(etapasCanonicas());
    globalThis.fetch = servidor.fetchMock;
    renderPage(`/ops/${ordenId}/editar`);
    await screen.findByDisplayValue('1871');

    fireEvent.click(screen.getAllByRole('button', { name: /quitar/i })[0]!);

    await waitFor(() => expect(servidor.fetchMock.mock.calls.some(([url, init]) =>
      String(url) === `/api/ops/${ordenId}/etapas/e-1` && init?.method === 'DELETE')).toBe(true));
  });
});
