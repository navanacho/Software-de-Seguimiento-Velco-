import { describe, expect, it, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { TarjetaOrden } from './TarjetaOrden.tsx';
import { crearTarjeta } from '../../../../test/tablero/fixtures.ts';

afterEach(cleanup);

describe('TarjetaOrden grilla única (4.13, RN-GLOBAL-01)', () => {
  it('una tarjeta no crea contenedores de columna por etapa', () => {
    const { container } = render(<TarjetaOrden tarjeta={crearTarjeta()} onAlternarEtapa={() => {}} />);
    expect(container.querySelectorAll('[data-testid="tarjeta-orden"]').length).toBe(1);
    expect(container.querySelector('[data-columna-etapa]')).toBeNull();
  });
});
