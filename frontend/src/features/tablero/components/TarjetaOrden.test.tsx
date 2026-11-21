import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TarjetaOrden } from './TarjetaOrden.tsx';
import { crearTarjeta } from '../../../../test/tablero/fixtures.ts';

describe('TarjetaOrden (4.1-4.3)', () => {
  it('muestra numeroOp, clienteNombre, descripcionPieza y etapas', () => {
    render(<TarjetaOrden tarjeta={crearTarjeta({ numeroOp: 'OT-99', clienteNombre: 'ACME', descripcionPieza: 'Eje' })} onAlternarEtapa={() => {}} />);
    expect(screen.getByText('OT-99')).toBeDefined();
    expect(screen.getByText('ACME')).toBeDefined();
    expect(screen.getByText('Eje')).toBeDefined();
    expect(screen.getByText('Corte')).toBeDefined();
  });

  it('no lanza con clienteNombre null y sin etapas (RN-GLOBAL-03)', () => {
    render(<TarjetaOrden tarjeta={crearTarjeta({ clienteNombre: null, etapas: [] })} onAlternarEtapa={() => {}} />);
    expect(screen.getByText('OT-1')).toBeDefined();
  });
});
