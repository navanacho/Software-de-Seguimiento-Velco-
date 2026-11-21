import { describe, expect, it, vi, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useActualizarEtapa } from './useActualizarEtapa.ts';
import { crearEnvelope, crearTarjeta, crearEtapa } from '../../../../test/tablero/fixtures.ts';
import type { ReactNode } from 'react';
import type { RespuestaListadoTablero } from '../../../shared/domain-client/tipos.ts';

afterEach(() => { vi.restoreAllMocks(); });

function wrapper(qc: QueryClient) {
  return ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('useActualizarEtapa (7.1-7.13, RN-AVANCE-01/02, RN-GLOBAL-02)', () => {
  it('hace PATCH, aplica optimista solo completada y reemplaza con DTO en success', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const base = crearEnvelope({ ops: [crearTarjeta({ id: 'op1', etapas: [crearEtapa({ id: 'e1', completada: false })], avance: 0, semaforo: 'En plazo', etapaAhora: 'Corte' })] });
    qc.setQueryData(['tablero', {}], base);
    const respuesta = crearTarjeta({ id: 'op1', etapas: [crearEtapa({ id: 'e1', completada: true })], avance: 100, semaforo: 'Terminado', etapaAhora: 'Todo listo', etiquetaPlazo: 'Terminado' });
    globalThis.fetch = vi.fn(async () => new Response(JSON.stringify(respuesta), { status: 200, headers: { 'content-type': 'application/json' } }));

    const { result } = renderHook(() => useActualizarEtapa(), { wrapper: wrapper(qc) });
    await act(async () => { result.current.mutate({ ordenId: 'op1', etapaId: 'e1', completada: true }); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const final = qc.getQueryData<RespuestaListadoTablero>(['tablero', {}]);
    expect(final?.ops[0]?.avance).toBe(100);
    expect(final?.ops[0]?.semaforo).toBe('Terminado');
    expect(final?.ops[0]?.etapaAhora).toBe('Todo listo');
  });

  it('rollback restaura completada anterior en error', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const base = crearEnvelope({ ops: [crearTarjeta({ id: 'op1', etapas: [crearEtapa({ id: 'e1', completada: false })], avance: 0 })] });
    qc.setQueryData(['tablero', {}], base);
    globalThis.fetch = vi.fn(async () => new Response(JSON.stringify({}), { status: 500, headers: { 'content-type': 'application/json' } }));

    const { result } = renderHook(() => useActualizarEtapa(), { wrapper: wrapper(qc) });
    await act(async () => { result.current.mutate({ ordenId: 'op1', etapaId: 'e1', completada: true }); });
    await waitFor(() => expect(result.current.isError).toBe(true));

    const final = qc.getQueryData<RespuestaListadoTablero>(['tablero', {}]);
    expect(final?.ops[0]?.etapas[0]?.completada).toBe(false);
  });

  it('rollback restaura en todas las queries tablero con la misma OP', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const base = crearEnvelope({ ops: [crearTarjeta({ id: 'op1', etapas: [crearEtapa({ id: 'e1', completada: false })] })] });
    qc.setQueryData(['tablero', {}], base);
    qc.setQueryData(['tablero', { estado: 'En plazo' }], base);
    globalThis.fetch = vi.fn(async () => new Response(JSON.stringify({}), { status: 500, headers: { 'content-type': 'application/json' } }));

    const { result } = renderHook(() => useActualizarEtapa(), { wrapper: wrapper(qc) });
    await act(async () => { result.current.mutate({ ordenId: 'op1', etapaId: 'e1', completada: true }); });
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(qc.getQueryData<RespuestaListadoTablero>(['tablero', {}])?.ops[0]?.etapas[0]?.completada).toBe(false);
    expect(qc.getQueryData<RespuestaListadoTablero>(['tablero', { estado: 'En plazo' }])?.ops[0]?.etapas[0]?.completada).toBe(false);
  });
});
