import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { DetalleOpPage } from './DetalleOpPage.tsx';
import { crearDetalle } from '../../../test/ordenes/fixtures.ts';
import type { DetalleOpDTO } from '../../shared/domain-client/tipos.ts';

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

type FilaComparativa = DetalleOpDTO['comparativaPorEtapa'][number];

function filaComparativa(parcial: Partial<FilaComparativa> = {}): FilaComparativa {
  return {
    etapaId: 'e-1',
    nombreEtapa: 'Corte',
    horasVendidas: '7.50',
    horasReales: '6.00',
    desvioHoras: '-1.50',
    porcentajeConsumo: '80.00',
    alertaDesvio: false,
    ...parcial,
  };
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

  it('ofrece las pestañas Detalle y Análisis de Rentabilidad con Detalle seleccionada por defecto', async () => {
    vi.stubGlobal('fetch', fetchDetalle());
    renderCon(<DetalleOpPage ordenId={ordenId} />);
    const pestanaDetalle = await screen.findByRole('tab', { name: 'Detalle' });
    const pestanaAnalisis = screen.getByRole('tab', { name: 'Análisis de Rentabilidad' });
    expect(pestanaDetalle.getAttribute('aria-selected')).toBe('true');
    expect(pestanaAnalisis.getAttribute('aria-selected')).toBe('false');
    expect(screen.getByRole('tabpanel', { name: 'Detalle' })).toBeDefined();
    expect(screen.getByText('Horas reales')).toBeDefined();
  });

  it('muestra el panel analítico al seleccionar Análisis de Rentabilidad', async () => {
    vi.stubGlobal('fetch', fetchDetalle(crearDetalle({
      id: ordenId,
      comparativaPorEtapa: [filaComparativa()],
    })));
    renderCon(<DetalleOpPage ordenId={ordenId} />);
    const pestanaAnalisis = await screen.findByRole('tab', { name: 'Análisis de Rentabilidad' });
    fireEvent.click(pestanaAnalisis);
    expect(await screen.findByRole('tabpanel', { name: 'Análisis de Rentabilidad' })).toBeDefined();
    expect(screen.getByRole('table', { name: /comparativa de horas por etapa/i })).toBeDefined();
    expect(screen.queryByTestId('detalle-op-cabecera')).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Materiales' })).toBeNull();
  });

  it('no repite la consulta ni recalcula derivados al cambiar de pestaña', async () => {
    const fetchOp = fetchDetalle(crearDetalle({
      id: ordenId,
      porcentajeConsumo: '150.00',
      alertaDesvio: true,
      comparativaPorEtapa: [filaComparativa({
        horasVendidas: '2.00',
        horasReales: '9.00',
        desvioHoras: '7.00',
        porcentajeConsumo: null,
        alertaDesvio: true,
      })],
    }));
    vi.stubGlobal('fetch', fetchOp);
    renderCon(<DetalleOpPage ordenId={ordenId} />);
    const pestanaDetalle = await screen.findByRole('tab', { name: 'Detalle' });
    const consultasIniciales = fetchOp.mock.calls.filter(([url]) => !String(url).endsWith('/horas'));
    expect(consultasIniciales).toHaveLength(1);

    fireEvent.click(screen.getByRole('tab', { name: 'Análisis de Rentabilidad' }));
    const fila = await screen.findByRole('rowheader', { name: 'Corte' });
    expect(fila.parentElement?.textContent).toContain('9.00');
    expect(fila.parentElement?.textContent).toContain('7.00');
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getByRole('status').textContent).toBe('Alerta de desvío de horas');

    fireEvent.click(screen.getByRole('tab', { name: 'Detalle' }));
    expect(await screen.findByRole('tabpanel', { name: 'Detalle' })).toBeDefined();
    fireEvent.click(pestanaDetalle);
    fireEvent.click(screen.getByRole('tab', { name: 'Análisis de Rentabilidad' }));
    expect(await screen.findByRole('rowheader', { name: 'Corte' })).toBeDefined();
    expect(fetchOp.mock.calls.filter(([url]) => !String(url).endsWith('/horas'))).toHaveLength(consultasIniciales.length);
  });
});
