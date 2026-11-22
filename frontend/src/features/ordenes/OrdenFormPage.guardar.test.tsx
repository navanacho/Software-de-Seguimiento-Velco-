import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom';
import { OrdenFormPage } from './OrdenFormPage.tsx';
import { crearDetalle, crearMaterialDetalle } from '../../../test/ordenes/fixtures.ts';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function respuestaJson(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), { status, headers: { 'content-type': 'application/json' } });
}

function RutaEditar({ clientes }: { readonly clientes: readonly { id: string; nombre: string }[] }) {
  const { id = '' } = useParams();
  return <OrdenFormPage ordenId={id} clientes={clientes} />;
}

function RutaDetalle() {
  const { id = '' } = useParams();
  return <p data-testid="detalle-destino">{`Detalle OP destino: ${id}`}</p>;
}

function renderPage(ruta: string, clientes: { id: string; nombre: string }[] = []) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[ruta]}>
        <Routes>
          <Route path="/ops/nueva" element={<OrdenFormPage clientes={clientes} />} />
          <Route path="/ops/:id/editar" element={<RutaEditar clientes={clientes} />} />
          <Route path="/ops/:id" element={<RutaDetalle />} />
          <Route path="/" element={<p>Tablero destino</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return qc;
}

function completarAlta() {
  fireEvent.change(screen.getByLabelText(/n° op/i), { target: { value: '1872' } });
  fireEvent.change(screen.getByLabelText(/id de plano/i), { target: { value: 'PL-2026-046' } });
  fireEvent.change(screen.getByLabelText(/^cliente$/i), { target: { value: 'c-1' } });
  fireEvent.change(screen.getByLabelText(/descripción de la pieza/i), { target: { value: 'Eje B' } });
  fireEvent.change(screen.getByLabelText(/fecha de entrega/i), { target: { value: '2026-12-10' } });
  fireEvent.change(screen.getByLabelText(/monto vendido/i), { target: { value: '1500.00' } });
}

describe('OrdenFormPage mutaciones (sección 4/6, D4/D6/D8)', () => {
  it('hace POST /api/ops sin etapas cuando no se modificaron y navega al tablero', async () => {
    const fetchMock = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => respuestaJson(crearDetalle(), 201));
    globalThis.fetch = fetchMock;
    const qc = renderPage('/ops/nueva', [{ id: 'c-1', nombre: 'ACME' }]);
    const invalidar = vi.spyOn(qc, 'invalidateQueries');
    completarAlta();
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => expect(screen.getByText('Tablero destino')).toBeDefined());
    expect(invalidar).toHaveBeenCalledWith({ queryKey: ['tablero'] });
    const llamada = fetchMock.mock.calls.find(([url]) => String(url).includes('/api/ops'))!;
    const cuerpo = JSON.parse(String(llamada[1]?.body)) as Record<string, unknown>;
    expect(cuerpo).toMatchObject({
      numeroOp: '1872',
      codigoPlano: 'PL-2026-046',
      clienteNombre: 'ACME',
      descripcionPieza: 'Eje B',
      fechaEntrega: '2026-12-10',
      montoVendido: '1500.00',
    });
    expect(cuerpo.etapas).toBeUndefined();
    expect(cuerpo.fechaIngreso).toBeUndefined();
    expect(cuerpo.avance).toBeUndefined();
  });

  it('hace PUT /api/ops/:id sin etapas ni materiales al editar la cabecera', async () => {
    const fetchMock = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === undefined) return respuestaJson(crearDetalle());
      return respuestaJson(crearDetalle());
    });
    globalThis.fetch = fetchMock;
    renderPage('/ops/op-1/editar');
    await screen.findByDisplayValue('1871');
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => expect(screen.getByText('Tablero destino')).toBeDefined());
    const llamada = fetchMock.mock.calls.find(([url, init]) => String(url).includes('/api/ops/op-1') && init?.method === 'PUT')!;
    const cuerpo = JSON.parse(String(llamada[1]?.body)) as Record<string, unknown>;
    expect(cuerpo.etapas).toBeUndefined();
    expect(cuerpo.materiales).toBeUndefined();
    expect(cuerpo.numeroOp).toBe('1871');
  });

  it.each([
    { id: 'op-existente', numeroOp: '1871' },
    { id: 'op-uuid-2', numeroOp: '1904' },
  ])('muestra el 409 de plano y navega al detalle de la OP $numeroOp', async ({ id, numeroOp }) => {
    globalThis.fetch = vi.fn(async (url: RequestInfo | URL) => {
      if (String(url).includes('/api/ops')) {
        return respuestaJson({
          error: 'codigo_plano_duplicado',
          message: `El ID de plano PL-2026-045 ya está asignado a la OP ${numeroOp}.`,
          codigoPlano: 'PL-2026-045',
          opExistente: { id, numeroOp },
        }, 409);
      }
      return respuestaJson({});
    });
    renderPage('/ops/nueva', [{ id: 'c-1', nombre: 'ACME' }]);
    completarAlta();
    fireEvent.change(screen.getByLabelText(/id de plano/i), { target: { value: 'PL-2026-045' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));

    const enlace = await screen.findByRole('link', { name: `Ver OP ${numeroOp}` });
    expect(await screen.findByText(`El ID de plano PL-2026-045 ya está asignado a la OP ${numeroOp}.`)).toBeDefined();
    expect(enlace.getAttribute('href')).toBe(`/ops/${id}`);
    expect((screen.getByLabelText(/id de plano/i) as HTMLInputElement).getAttribute('aria-invalid')).toBe('true');
    expect((screen.getByLabelText(/n° op/i) as HTMLInputElement).value).toBe('1872');
    expect(screen.queryByText('Tablero destino')).toBeNull();

    fireEvent.click(enlace);

    expect(await screen.findByTestId('detalle-destino')).toBeDefined();
    expect(screen.getByTestId('detalle-destino').textContent).toBe(`Detalle OP destino: ${id}`);
    expect(screen.queryByText('Tablero destino')).toBeNull();
  });

  it('resalta N° OP en 409 de numero_op sin enlazar a otra OP', async () => {
    globalThis.fetch = vi.fn(async (url: RequestInfo | URL) => {
      if (String(url).includes('/api/ops')) {
        return respuestaJson({
          error: 'numero_op_duplicado',
          message: 'Ya existe una orden con ese número.',
          numeroOp: '1872',
        }, 409);
      }
      return respuestaJson({});
    });
    renderPage('/ops/nueva', [{ id: 'c-1', nombre: 'ACME' }]);
    completarAlta();
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));

    expect(await screen.findByText('Ya existe una orden con ese número.')).toBeDefined();
    expect((screen.getByLabelText(/n° op/i) as HTMLInputElement).getAttribute('aria-invalid')).toBe('true');
    expect(screen.queryByRole('link')).toBeNull();
    expect((screen.getByLabelText(/n° op/i) as HTMLInputElement).value).toBe('1872');
    expect(screen.queryByText('Tablero destino')).toBeNull();
  });

  it('asocia errores 422 a cada campo y conserva lo escrito', async () => {
    globalThis.fetch = vi.fn(async () => respuestaJson({
      error: 'validation_error',
      message: 'Datos inválidos',
      details: [
        { path: 'numeroOp', message: 'N° OP inválido' },
        { path: 'clienteNombre', message: 'Cliente inválido' },
      ],
    }, 422));
    renderPage('/ops/nueva', [{ id: 'c-1', nombre: 'ACME' }]);
    completarAlta();
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));

    expect(await screen.findByTestId('error-numeroOp')).toBeDefined();
    expect(screen.getByTestId('error-clienteNombre')).toBeDefined();
    expect((screen.getByLabelText(/n° op/i) as HTMLInputElement).value).toBe('1872');
  });

  it('da de alta materiales en edición con POST /api/ops/:id/materiales', async () => {
    const materialCreado = crearMaterialDetalle({
      id: 'm-2',
      descripcion: 'Cobre',
      cantidad: '3.00',
      costoUnitarioCotizado: '12.00',
    });
    const fetchMock = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === undefined) return respuestaJson(crearDetalle({ materiales: [] }));
      if (String(url).includes('/materiales')) return respuestaJson(materialCreado, 201);
      return respuestaJson(crearDetalle({ materiales: [] }));
    });
    globalThis.fetch = fetchMock;
    renderPage('/ops/op-1/editar');
    await screen.findByDisplayValue('1871');

    fireEvent.change(screen.getByLabelText(/descripción del material/i), { target: { value: 'Cobre' } });
    fireEvent.change(screen.getByLabelText(/^cantidad$/i), { target: { value: '3.00' } });
    fireEvent.change(screen.getByLabelText(/^unidad$/i), { target: { value: 'kg' } });
    fireEvent.change(screen.getByLabelText(/costo unitario cotizado/i), { target: { value: '12.00' } });
    fireEvent.click(screen.getByRole('button', { name: /agregar material/i }));

    await waitFor(() => expect(screen.getByTestId('material-agregado')).toBeDefined());
    expect(screen.getByText(/MP: Cobre — 3.00/)).toBeDefined();
    expect(screen.queryByRole('button', { name: /borrar/i })).toBeNull();
    const llamada = fetchMock.mock.calls.find(([url, init]) =>
      String(url).includes('/api/ops/op-1/materiales') && init?.method === 'POST')!;
    expect(JSON.parse(String(llamada[1]?.body))).toEqual({
      tipo: 'MP',
      descripcion: 'Cobre',
      cantidad: '3.00',
      unidad: 'kg',
      costoUnitarioCotizado: '12.00',
    });
  });

  it('reutiliza cliente existente devuelto con 200 en alta inline', async () => {
    const fetchMock = vi.fn(async (url: RequestInfo | URL, _init?: RequestInit) => {
      if (String(url).includes('/api/clientes')) {
        return respuestaJson({ id: 'c-reutilizado', nombre: 'ACME', createdAt: '2026-11-22' }, 200);
      }
      return respuestaJson(crearDetalle(), 201);
    });
    globalThis.fetch = fetchMock;
    renderPage('/ops/nueva');
    completarAlta();
    fireEvent.change(screen.getByLabelText(/^cliente$/i), { target: { value: '__nuevo__' } });
    fireEvent.change(screen.getByLabelText(/nombre del cliente/i), { target: { value: 'ACME' } });
    fireEvent.click(screen.getByRole('button', { name: /confirmar cliente/i }));
    await waitFor(() => expect((screen.getByLabelText(/^cliente$/i) as HTMLSelectElement).value).toBe('c-reutilizado'));
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => expect(screen.getByText('Tablero destino')).toBeDefined());
    const clientes = fetchMock.mock.calls.filter(([url]) => String(url).includes('/api/clientes'));
    expect(clientes).toHaveLength(1);
  });
});
