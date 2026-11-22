import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { DetalleOpPage } from './DetalleOpPage.tsx';
import { crearDetalle } from '../../../test/ordenes/fixtures.ts';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function respuestaJson(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), { status, headers: { 'content-type': 'application/json' } });
}

function renderCon(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('DetalleOpPage (spec detalle-op-ui, D7)', () => {
  it('muestra cabecera, badge, etapas con horas vendidas y materiales del DTO', async () => {
    globalThis.fetch = vi.fn(async () => respuestaJson(crearDetalle()));
    renderCon(<DetalleOpPage ordenId="op-1" />);
    expect(await screen.findByText(/1871/)).toBeDefined();
    expect(screen.getByTestId('badge-plano').textContent).toBe('Plano: PL-2026-045');
    expect(screen.getByText(/7\.50/)).toBeDefined();
    expect(screen.getByText(/Acero/)).toBeDefined();
  });

  it('ofrece Editar hacia /ops/:id/editar y no muestra horas reales ni controles de materiales', async () => {
    globalThis.fetch = vi.fn(async () => respuestaJson(crearDetalle()));
    renderCon(<DetalleOpPage ordenId="op-1" />);
    const enlace = await screen.findByRole('link', { name: /editar/i });
    expect(enlace.getAttribute('href')).toBe('/ops/op-1/editar');
    expect(screen.queryByText(/horas reales/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /borrar/i })).toBeNull();
  });

  it('muestra error claro ante 404 sin datos de ejemplo', async () => {
    globalThis.fetch = vi.fn(async () => respuestaJson({ error: 'not_found', message: 'OP inexistente' }, 404));
    renderCon(<DetalleOpPage ordenId="op-inexistente" />);
    expect(await screen.findByRole('alert')).toBeDefined();
    expect(screen.queryByTestId('detalle-op-cabecera')).toBeNull();
  });
});
