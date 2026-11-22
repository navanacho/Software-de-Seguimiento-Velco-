import { describe, expect, it, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { TableroPage } from './TableroPage.tsx';
import { crearEnvelope, crearTarjeta, crearEtapa } from '../../../test/tablero/fixtures.ts';
import type { ReactNode } from 'react';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function respuestaJson(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function renderCon(qc: QueryClient, ui: ReactNode) {
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/']}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('TableroPage integración (6.x, 7.x, 8.x)', () => {
  it('muestra filtros, KPIs, tira, grilla y aplica filtro por estado via query', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const env = crearEnvelope();
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => respuestaJson(env));
    globalThis.fetch = fetchMock;
    renderCon(qc, <TableroPage />);
    expect(await screen.findByTestId('kpis-tablero')).toBeDefined();
    expect(screen.getByTestId('tira-flujo')).toBeDefined();
    fireEvent.change(screen.getByLabelText(/estado/i), { target: { value: 'Atrasado' } });
    await waitFor(() => expect(fetchMock.mock.calls.some((c) => String(c[0]).includes('estado=Atrasado'))).toBe(true));
  });

  it('estado vacío con filtros activos muestra limpiar y recargar (Flujo 2)', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const vacio = crearEnvelope({ ops: [], kpis: { total: 0, porEstado: { Terminado: 0, Atrasado: 0, 'En riesgo': 0, 'En plazo': 0 } }, flujo: [] });
    globalThis.fetch = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => respuestaJson(vacio));
    renderCon(qc, <TableroPage />);
    await screen.findByTestId('tablero-page');
    fireEvent.change(screen.getByLabelText(/buscar/i), { target: { value: 'nada' } });
    await waitFor(() => expect(screen.queryByTestId('estado-vacio-tablero')).not.toBeNull());
    expect(screen.getAllByRole('button', { name: /limpiar filtros/i }).length).toBeGreaterThan(0);
  });

  it('mantiene opciones cliente base tras filtrar por cliente A y permite seleccionar cliente B enviando query (OQ-3 guardrail)', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const base = crearEnvelope({ ops: [
      crearTarjeta({ id: 'op1', clienteId: 'c1', clienteNombre: 'A', numeroOp: 'OT-1' }),
      crearTarjeta({ id: 'op2', clienteId: 'c2', clienteNombre: 'B', numeroOp: 'OT-2' }),
    ] });
    const soloA = crearEnvelope({ ops: [crearTarjeta({ id: 'op1', clienteId: 'c1', clienteNombre: 'A', numeroOp: 'OT-1' })] });
    const soloB = crearEnvelope({ ops: [crearTarjeta({ id: 'op2', clienteId: 'c2', clienteNombre: 'B', numeroOp: 'OT-2' })] });
    const fetchMock = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
      const u = String(input);
      if (u.includes('clienteId=c1')) return respuestaJson(soloA);
      if (u.includes('clienteId=c2')) return respuestaJson(soloB);
      return respuestaJson(base);
    });
    globalThis.fetch = fetchMock;
    renderCon(qc, <TableroPage />);
    await screen.findByTestId('kpis-tablero');
    fireEvent.change(screen.getByLabelText(/cliente/i), { target: { value: 'c1' } });
    await waitFor(() => {
      const select = screen.getByLabelText(/cliente/i) as HTMLSelectElement;
      const values = Array.from(select.options).map((o) => o.value);
      expect(values).toContain('c2');
    });
    fireEvent.change(screen.getByLabelText(/cliente/i), { target: { value: 'c2' } });
    await waitFor(() => expect(fetchMock.mock.calls.some((c) => String(c[0]).includes('clienteId=c2'))).toBe(true));
  });

  it('checkbox dispara PATCH y repinta con DTO respuesta (7.x)', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const base = crearEnvelope({ ops: [crearTarjeta({ id: 'op1', etapas: [crearEtapa({ id: 'e1', nombre: 'Corte', completada: false })], avance: 0, semaforo: 'En plazo', etapaAhora: 'Corte' })] });
    const respuesta = crearTarjeta({ id: 'op1', etapas: [crearEtapa({ id: 'e1', nombre: 'Corte', completada: true })], avance: 100, semaforo: 'Terminado', etapaAhora: 'Todo listo', etiquetaPlazo: 'Terminado' });
    let patched = false;
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
      if (String(input).includes('/etapas/')) { patched = true; return respuestaJson(respuesta); }
      return respuestaJson(patched ? { ...base, ops: [respuesta] } : base);
    });
    renderCon(qc, <TableroPage />);
    const cb = await screen.findByRole('checkbox');
    fireEvent.click(cb);
    await waitFor(() => expect(screen.getByTestId('tarjeta-etiqueta-plazo').textContent).toContain('Terminado'));
  });

  it('renderiza 3 tarjetas en una sola grilla sin contenedores por etapa', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const env = crearEnvelope({ ops: [
      crearTarjeta({ id: 'op1', numeroOp: 'OT-1' }),
      crearTarjeta({ id: 'op2', numeroOp: 'OT-2' }),
      crearTarjeta({ id: 'op3', numeroOp: 'OT-3' }),
    ] });
    globalThis.fetch = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => respuestaJson(env));
    renderCon(qc, <TableroPage />);
    await screen.findByTestId('kpis-tablero');
    const grilla = screen.getByTestId('grilla-tarjetas');
    expect(grilla.querySelectorAll('[data-testid="tarjeta-orden"]').length).toBe(3);
    expect(grilla.querySelectorAll('[data-testid="columna-etapa"]').length).toBe(0);
  });

  it('invalida queries tablero en onSettled tras mutación', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const base = crearEnvelope({ ops: [crearTarjeta({ id: 'op1', etapas: [crearEtapa({ id: 'e1', nombre: 'Corte', completada: false })], avance: 0, semaforo: 'En plazo', etapaAhora: 'Corte' })] });
    const respuesta = crearTarjeta({ id: 'op1', etapas: [crearEtapa({ id: 'e1', nombre: 'Corte', completada: true })], avance: 100, semaforo: 'Terminado', etapaAhora: 'Todo listo', etiquetaPlazo: 'Terminado' });
    let patched = false;
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
      if (String(input).includes('/etapas/')) { patched = true; return respuestaJson(respuesta); }
      return respuestaJson(patched ? { ...base, ops: [respuesta] } : base);
    });
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');
    renderCon(qc, <TableroPage />);
    const cb = await screen.findByRole('checkbox');
    fireEvent.click(cb);
    await waitFor(() => expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['tablero'] }));
  });
});
