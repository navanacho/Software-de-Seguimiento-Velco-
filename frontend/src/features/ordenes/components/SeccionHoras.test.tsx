import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { readFileSync } from 'node:fs';
import type { ReactNode } from 'react';
import { SeccionHoras } from './SeccionHoras.tsx';
import { crearEtapaDetalle } from '../../../../test/ordenes/fixtures.ts';

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

const etapas = [crearEtapaDetalle({ id: etapaId, nombre: 'Corte', horasVendidas: '4.00' })];

const derivados = {
  horasVendidasTotales: '4.00',
  horasRealesTotales: '2.50',
  desvioHoras: '-1.50',
  porcentajeConsumo: '62.50',
  alertaDesvio: true,
};

function respuesta(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), { status, headers: { 'content-type': 'application/json' } });
}

function renderCon(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('SeccionHoras (C-09, HU-10/HU-13)', () => {
  it('muestra los derivados del DTO y el estado vacío sin calcular en React', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => respuesta([])));
    renderCon(<SeccionHoras ordenId={ordenId} etapas={etapas} derivados={derivados} />);
    expect(await screen.findByText(/sin partes registradas/i)).toBeDefined();
    expect(screen.getByText(/4\.00/)).toBeDefined();
    expect(screen.getByText('2.50')).toBeDefined();
    expect(screen.getByText(/-1\.50/)).toBeDefined();
    expect(screen.getByRole('status').textContent).toMatch(/desvío/i);

    const codigo = readFileSync('src/features/ordenes/components/SeccionHoras.tsx', 'utf8');
    expect(codigo).not.toMatch(/calcular|toFixed|reduce\(/);
  });

  it('bloquea horas inválidas antes de enviar y muestra error', async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => respuesta([]));
    vi.stubGlobal('fetch', fetchMock);
    renderCon(<SeccionHoras ordenId={ordenId} etapas={etapas} derivados={derivados} />);
    await screen.findByText(/sin partes registradas/i);
    fireEvent.click(screen.getByRole('button', { name: /cargar horas/i }));
    const dialogo = await screen.findByRole('dialog');
    fireEvent.change(within(dialogo).getByLabelText(/operario/i), { target: { value: 'Ana' } });
    fireEvent.change(within(dialogo).getByLabelText(/fecha/i), { target: { value: '2026-03-05' } });
    fireEvent.change(within(dialogo).getByLabelText('Horas'), { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));
    expect((await screen.findByRole('alert')).textContent).toMatch(/mayores a cero/i);
    expect(dialogo).toBeDefined();
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false);
  });

  it('muestra el mensaje de mayores a cero para horas negativas sin enviar la petición', async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => respuesta([]));
    vi.stubGlobal('fetch', fetchMock);
    renderCon(<SeccionHoras ordenId={ordenId} etapas={etapas} derivados={derivados} />);
    await screen.findByText(/sin partes registradas/i);
    fireEvent.click(screen.getByRole('button', { name: /cargar horas/i }));
    const dialogo = await screen.findByRole('dialog');
    fireEvent.change(within(dialogo).getByLabelText(/operario/i), { target: { value: 'Ana' } });
    fireEvent.change(within(dialogo).getByLabelText(/fecha/i), { target: { value: '2026-03-05' } });
    fireEvent.change(within(dialogo).getByLabelText('Horas'), { target: { value: '-1' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));
    expect((await screen.findByRole('alert')).textContent).toMatch(/mayores a cero/i);
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false);
  });

  it('propaga el día inyectado al modal de alta', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => respuesta([])));
    renderCon(
      <SeccionHoras
        ordenId={ordenId}
        etapas={etapas}
        derivados={derivados}
        hoy="2026-11-24"
      />,
    );
    await screen.findByText(/sin partes registradas/i);
    fireEvent.click(screen.getByRole('button', { name: /cargar horas/i }));
    const dialogo = await screen.findByRole('dialog');
    expect((within(dialogo).getByLabelText(/fecha/i) as HTMLInputElement).value).toBe('2026-11-24');
  });

  it('alta válida refresca el listado con la parte creada', async () => {
    let partes: readonly typeof parte[] = [];
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === 'POST') {
        const creado = { ...parte, ...(JSON.parse(String(init.body)) as Partial<typeof parte>) };
        partes = [creado];
        return respuesta(creado, 201);
      }
      return respuesta(partes);
    }));
    renderCon(<SeccionHoras ordenId={ordenId} etapas={etapas} derivados={derivados} />);
    await screen.findByText(/sin partes registradas/i);
    fireEvent.click(screen.getByRole('button', { name: /cargar horas/i }));
    const dialogo = screen.getByRole('dialog');
    fireEvent.change(within(dialogo).getByLabelText(/operario/i), { target: { value: 'Ana' } });
    fireEvent.change(within(dialogo).getByLabelText(/fecha/i), { target: { value: '2026-03-05' } });
    fireEvent.change(within(dialogo).getByLabelText('Horas'), { target: { value: '2.50' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));
    await waitFor(() => expect(screen.getByText(/Ana/)).toBeDefined());
    expect(screen.queryByText(/sin partes registradas/i)).toBeNull();
  });

  it('muestra la etapa y la observación del DTO cuando existen', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => respuesta([{ ...parte, observacion: 'Revisar tornillería' }])));
    renderCon(<SeccionHoras ordenId={ordenId} etapas={etapas} derivados={derivados} />);
    expect(await screen.findByText(/Ana/)).toBeDefined();
    expect(screen.getByText(`Etapa: ${etapaId}`)).toBeDefined();
    expect(screen.getByText('Observación: Revisar tornillería')).toBeDefined();
  });

  it('omite etapa y observación cuando el DTO no las trae', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => respuesta([{ ...parte, etapaId: null, observacion: null }])));
    renderCon(<SeccionHoras ordenId={ordenId} etapas={etapas} derivados={derivados} />);
    expect(await screen.findByText(/Ana/)).toBeDefined();
    expect(screen.queryByText(/Etapa:/i)).toBeNull();
    expect(screen.queryByText(/Observación:/i)).toBeNull();
  });

  it('muestra un error accionable y conserva la fila cuando falla DELETE', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === 'DELETE') return respuesta({ message: 'falla del servidor' }, 500);
      return respuesta([parte]);
    });
    vi.stubGlobal('fetch', fetchMock);
    renderCon(<SeccionHoras ordenId={ordenId} etapas={etapas} derivados={derivados} />);
    expect(await screen.findByText(/Ana/)).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /eliminar parte/i }));
    const alerta = await screen.findByRole('alert');
    expect(alerta.textContent).toMatch(/no se pudo eliminar/i);
    expect(alerta.textContent).toMatch(/falla del servidor/i);
    expect(alerta.textContent).toMatch(/reintent/i);
    expect(screen.getByText(/Ana/)).toBeDefined();
    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === 'DELETE')).toHaveLength(1);
  });

  it('permite reintentar DELETE tras un fallo y quita la fila si el reintento funciona', async () => {
    let partes: readonly typeof parte[] = [parte];
    let intentos = 0;
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === 'DELETE') {
        intentos += 1;
        if (intentos === 1) return respuesta({ message: 'falla temporal' }, 503);
        partes = [];
        return respuesta({ ok: true });
      }
      return respuesta(partes);
    }));
    renderCon(<SeccionHoras ordenId={ordenId} etapas={etapas} derivados={derivados} />);
    expect(await screen.findByText(/Ana/)).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /eliminar parte/i }));
    expect(await screen.findByRole('alert')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: /reintentar eliminación/i }));
    await waitFor(() => expect(screen.getByText(/sin partes registradas/i)).toBeDefined());
    expect(intentos).toBe(2);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('edición actualiza la fila y eliminación la quita del listado', async () => {
    let partes: readonly typeof parte[] = [parte];
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === 'PATCH') {
        partes = partes.map((p) => ({ ...p, ...(JSON.parse(String(init.body)) as Partial<typeof parte>) }));
        return respuesta(partes[0]);
      }
      if (init?.method === 'DELETE') {
        partes = [];
        return respuesta({ ok: true });
      }
      return respuesta(partes);
    }));
    renderCon(<SeccionHoras ordenId={ordenId} etapas={etapas} derivados={derivados} />);
    expect(await screen.findByText('2026-03-05 — Ana — 2.50')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /editar parte/i }));
    const dialogo = screen.getByRole('dialog');
    fireEvent.change(within(dialogo).getByLabelText('Horas'), { target: { value: '3.00' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));
    await waitFor(() => expect(screen.getByText('2026-03-05 — Ana — 3.00')).toBeDefined());

    fireEvent.click(screen.getByRole('button', { name: /eliminar parte/i }));
    await waitFor(() => expect(screen.getByText(/sin partes registradas/i)).toBeDefined());
  });
});
