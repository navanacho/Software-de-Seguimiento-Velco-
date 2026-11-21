import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './App.tsx';

describe('App tablero (3.6-3.7)', () => {
  it('monta el tablero en / y conserva /salud', async () => {
    const envelope = { ops: [], kpis: { total: 0, porEstado: { Terminado: 0, Atrasado: 0, 'En riesgo': 0, 'En plazo': 0 } }, flujo: [] };
    const original = globalThis.fetch;
    globalThis.fetch = async () => new Response(JSON.stringify(envelope), { status: 200, headers: { 'content-type': 'application/json' } });
    render(<App rutaInicial="/" />);
    expect(await screen.findByTestId('tablero-page')).toBeDefined();
    globalThis.fetch = original;
  });
});
