import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { cleanup, render, screen } from '@testing-library/react';
import { TarjetaOrden } from './TarjetaOrden.tsx';
import { crearTarjeta } from '../../../../test/tablero/fixtures.ts';

afterEach(() => { cleanup(); });

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

  it('C-09 muestra Horas Reales / Horas Vendidas desde el DTO', () => {
    render(<TarjetaOrden
      tarjeta={crearTarjeta({ id: 'op-1', horasRealesTotales: '30.00', horasVendidasTotales: '40.00' })}
      onAlternarEtapa={() => {}}
    />);
    expect(screen.getByTestId('tarjeta-horas').textContent).toContain('Horas Reales / Horas Vendidas: 30.00 / 40.00');
    expect(screen.getByTestId('barra-horas')).toBeDefined();
  });

  it('C-09 OQ-2=A: Cargar horas navega al detalle con intención de abrir el modal', () => {
    render(<TarjetaOrden tarjeta={crearTarjeta({ id: 'op-1' })} onAlternarEtapa={() => {}} />);
    expect(screen.getByRole('link', { name: /cargar horas/i }).getAttribute('href')).toBe('/ops/op-1?accion=cargar-horas');
  });

  it('C-09 RN-GLOBAL-02: la tarjeta no calcula ni importa funciones de dominio', () => {
    const codigo = readFileSync('src/features/tablero/components/TarjetaOrden.tsx', 'utf8');
    expect(codigo).not.toMatch(/calcular|toFixed|reduce\(/);
  });
});
