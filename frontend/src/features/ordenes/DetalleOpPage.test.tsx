import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { DetalleOpPage } from './DetalleOpPage.tsx';
import { crearDetalle } from '../../../test/ordenes/fixtures.ts';

const ordenId = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function respuestaJson(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), { status, headers: { 'content-type': 'application/json' } });
}

function fetchDetalle(detalle = crearDetalle({ id: ordenId })) {
  return vi.fn(async (url: URL | RequestInfo) =>
    String(url).endsWith('/horas') ? respuestaJson([]) : respuestaJson(detalle),
  );
}

function renderCon(ui: ReactNode, ruta = `/ops/${ordenId}`) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[ruta]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('DetalleOpPage (spec detalle-op-ui, D7)', () => {
  it('muestra cabecera, badge, etapas, horas y materiales del DTO', async () => {
    vi.stubGlobal('fetch', fetchDetalle(crearDetalle({ id: ordenId, horasRealesTotales: '3.00' })));
    renderCon(<DetalleOpPage ordenId={ordenId} />);
    expect(await screen.findByText(/1871/)).toBeDefined();
    expect(screen.getByTestId('badge-plano').textContent).toBe('Plano: PL-2026-045');
    expect(screen.getByText(/7\.50/)).toBeDefined();
    expect(screen.getByText(/Acero/)).toBeDefined();
    expect(screen.getByText('Horas reales').parentElement?.textContent).toContain('3.00');
  });

  it('ofrece Editar hacia /ops/:id/editar sin controles de materiales', async () => {
    vi.stubGlobal('fetch', fetchDetalle());
    renderCon(<DetalleOpPage ordenId={ordenId} />);
    const enlace = await screen.findByRole('link', { name: /editar/i });
    expect(enlace.getAttribute('href')).toBe(`/ops/${ordenId}/editar`);
    expect(screen.queryByRole('button', { name: /borrar/i })).toBeNull();
  });

  it('abre el modal de carga desde ?accion=cargar-horas (OQ-2=A)', async () => {
    vi.stubGlobal('fetch', fetchDetalle());
    renderCon(<DetalleOpPage ordenId={ordenId} />, `/ops/${ordenId}?accion=cargar-horas`);
    expect(await screen.findByRole('dialog', { name: /cargar horas/i })).toBeDefined();
  });

  it('muestra error claro ante 404 sin datos de ejemplo', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => respuestaJson({ error: 'not_found', message: 'OP inexistente' }, 404)));
    renderCon(<DetalleOpPage ordenId={ordenId} />);
    expect(await screen.findByRole('alert')).toBeDefined();
    expect(screen.queryByTestId('detalle-op-cabecera')).toBeNull();
  });
});
