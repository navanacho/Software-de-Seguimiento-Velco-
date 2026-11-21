import { describe, expect, it, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { TarjetaOrden } from './TarjetaOrden.tsx';
import { crearTarjeta } from '../../../../test/tablero/fixtures.ts';

afterEach(cleanup);

describe('TarjetaOrden sin slider (4.11-4.12)', () => {
  it('no tiene input[type=range] ni controles editables de porcentaje (HU-07, R3)', () => {
    const { container } = render(<TarjetaOrden tarjeta={crearTarjeta({ avance: 50 })} onAlternarEtapa={() => {}} />);
    expect(container.querySelector('input[type="range"]')).toBeNull();
    expect(container.querySelector('[contenteditable="true"]')).toBeNull();
    expect(container.textContent).toContain('50');
  });

  it('avance es solo lectura aunque cambie el valor (HU-07)', () => {
    const { container, rerender } = render(<TarjetaOrden tarjeta={crearTarjeta({ avance: 10 })} onAlternarEtapa={() => {}} />);
    rerender(<TarjetaOrden tarjeta={crearTarjeta({ avance: 90 })} onAlternarEtapa={() => {}} />);
    expect(container.querySelectorAll('input[type="range"]').length).toBe(0);
    expect(container.textContent).toContain('90');
  });
});
