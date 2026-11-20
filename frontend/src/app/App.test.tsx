import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from './App';

afterEach(cleanup);

describe('smoke de la SPA', () => {
  it('renderiza el estado del servicio desde el contrato compartido', () => {
    render(<App />);
    expect(screen.getByText(/estado: ok/i)).toBeDefined();
  });

  it('monta el proveedor de datos y el enrutador en un segundo destino', () => {
    render(<App rutaInicial="/salud" />);
    expect(screen.getByText(/estado: ok/i)).toBeDefined();
  });
});
