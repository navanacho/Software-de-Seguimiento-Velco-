import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { ErrorApi } from '../../../shared/domain-client/errores.ts';
import { claveOrden } from '../queries/clavesOrdenes.ts';
import { useCargarHora, useEditarHora, useEliminarHora, useHoras } from './useHoras.ts';

const ordenId = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';
const parteId = '2f8c1a4e-6d5b-4f0a-8c3e-1a2b3c4d5e6f';
const etapaId = '3a9c1a4e-6d5b-4f0a-8c3e-1a2b3c4d5e70';

const parte = {
  id: parteId,
  ordenId,
  etapaId,
  operario: 'Ana',
  fecha: '2026-03-05',
  horas: '2.50',
  createdAt: '2026-03-05T10:00:00.000Z',
  observacion: null,
};

function wrapper(qc: QueryClient) {
  return ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

function cliente(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
}

function respuesta(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), { status, headers: { 'content-type': 'application/json' } });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('hooks de horas (C-09)', () => {
  it('useHoras lista las partes del detalle', async () => {
    const fetchMock = vi.fn(async () => respuesta([parte]));
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useHoras(ordenId), { wrapper: wrapper(cliente()) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([parte]);
    expect(fetchMock).toHaveBeenCalledWith(`/api/ops/${ordenId}/horas`);
  });

  it('useCargarHora invalida el detalle y el tablero tras el éxito', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => respuesta(parte, 201)));
    const qc = cliente();
    const invalidar = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useCargarHora(ordenId), { wrapper: wrapper(qc) });
    await act(async () => {
      result.current.mutate({ etapaId, operario: 'Ana', fecha: '2026-03-05', horas: '2.50' });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidar).toHaveBeenCalledWith({ queryKey: claveOrden(ordenId) });
    expect(invalidar).toHaveBeenCalledWith({ queryKey: ['tablero'] });
  });

  it('useCargarHora expone ErrorApi con causa validation_error ante 422', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => respuesta({
      error: 'validation_error',
      message: 'horas inválidas',
      details: [{ path: 'horas', message: 'horas inválidas' }],
    }, 422)));
    const { result } = renderHook(() => useCargarHora(ordenId), { wrapper: wrapper(cliente()) });
    await act(async () => {
      result.current.mutate({ operario: 'Ana', fecha: '2026-03-05', horas: '2.50' });
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as ErrorApi).causa.tipo).toBe('validation_error');
  });

  it('useEditarHora expone ErrorApi con causa not_found ante 404', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => respuesta({ error: 'not_found', message: 'parte no encontrada' }, 404)));
    const { result } = renderHook(() => useEditarHora(ordenId), { wrapper: wrapper(cliente()) });
    await act(async () => {
      result.current.mutate({ parteId, cambios: { horas: '3.00' } });
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as ErrorApi).causa.tipo).toBe('not_found');
  });

  it('useEliminarHora invalida el detalle y el tablero tras el éxito', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => respuesta({ ok: true })));
    const qc = cliente();
    const invalidar = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useEliminarHora(ordenId), { wrapper: wrapper(qc) });
    await act(async () => { result.current.mutate(parteId); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidar).toHaveBeenCalledWith({ queryKey: claveOrden(ordenId) });
    expect(invalidar).toHaveBeenCalledWith({ queryKey: ['tablero'] });
  });
});
