import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTablero } from './useTablero.ts';
import { crearEnvelope } from '../../../../test/tablero/fixtures.ts';

function Wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

function Probe() {
  const { data } = useTablero({});
  return <div>{data?.ops[0]?.numeroOp ?? 'cargando'}</div>;
}

describe('useTablero (3.1-3.3)', () => {
  it('consulta el tablero y expone datos con queryKey [tablero, filtros]', async () => {
    const envelope = crearEnvelope();
    const original = globalThis.fetch;
    globalThis.fetch = async () => new Response(JSON.stringify(envelope), { status: 200, headers: { 'content-type': 'application/json' } });
    render(<Wrapper><Probe /></Wrapper>);
    expect(await screen.findByText('OT-1')).toBeDefined();
    globalThis.fetch = original;
  });

  it('genera keys distintas para filtros distintos y estables para misma combinación', async () => {
    const { clavesTablero } = await import('../queries/clavesTablero.ts');
    expect(clavesTablero({ estado: 'Atrasado' })).toEqual(['tablero', { estado: 'Atrasado' }]);
    expect(clavesTablero({ estado: 'Atrasado' })).toEqual(clavesTablero({ estado: 'Atrasado' }));
    expect(clavesTablero({ estado: 'Atrasado' })).not.toEqual(clavesTablero({ buscar: 'OT' }));
  });
});

