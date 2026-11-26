import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { TablaComparativaEtapas } from './TablaComparativaEtapas.tsx';
import type { DetalleOpDTO } from '../../../shared/domain-client/tipos.ts';

type Fila = DetalleOpDTO['comparativaPorEtapa'][number];

function fila(parcial: Partial<Fila> = {}): Fila {
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

afterEach(() => {
  cleanup();
});

describe('TablaComparativaEtapas (HU-15, DD-5)', () => {
  it('muestra tres etapas más la fila sintética Sin etapa con horas y porcentajes del DTO', () => {
    const filas = [
      fila(),
      fila({ etapaId: 'e-2', nombreEtapa: 'Pintura', horasVendidas: '10.00', horasReales: '12.50', desvioHoras: '2.50', porcentajeConsumo: '125.00', alertaDesvio: true }),
      fila({ etapaId: 'e-3', nombreEtapa: 'Armado', horasVendidas: '4.00', horasReales: '3.75', desvioHoras: '-0.25', porcentajeConsumo: '93.75' }),
      fila({ etapaId: null, nombreEtapa: 'Sin etapa', horasVendidas: '0.00', horasReales: '2.00', desvioHoras: '2.00', porcentajeConsumo: null, alertaDesvio: true }),
    ];
    render(<TablaComparativaEtapas filas={filas} />);
    const filasRenderizadas = screen.getAllByRole('row').slice(1);
    expect(filasRenderizadas).toHaveLength(4);
    expect(filasRenderizadas.map((filaRenderizada) => within(filaRenderizada).getByRole('rowheader').textContent))
      .toEqual(['Corte', 'Pintura', 'Armado', 'Sin etapa']);
    expect(within(filasRenderizadas[0]!).getByText('7.50')).toBeDefined();
    expect(within(filasRenderizadas[0]!).getByText('6.00')).toBeDefined();
    expect(within(filasRenderizadas[0]!).getByText('-1.50')).toBeDefined();
    expect(within(filasRenderizadas[0]!).getByText('80%')).toBeDefined();
    expect(within(filasRenderizadas[1]!).getByText('125%')).toBeDefined();
    expect(within(filasRenderizadas[2]!).getByText('93.75%')).toBeDefined();
  });

  it('muestra — para consumo nulo sin NaN, Infinity ni 0.00%', () => {
    render(<TablaComparativaEtapas filas={[fila({ etapaId: null, nombreEtapa: 'Sin etapa', porcentajeConsumo: null })]} />);
    const filaSinEtapa = screen.getByRole('rowheader', { name: 'Sin etapa' }).parentElement;
    expect(filaSinEtapa?.textContent).toContain('—');
    expect(filaSinEtapa?.textContent).not.toMatch(/NaN|Infinity|0\.00%/);
  });

  it('muestra el badge de alerta sólo en las filas con alertaDesvio true', () => {
    render(<TablaComparativaEtapas filas={[
      fila({ etapaId: 'e-1', nombreEtapa: 'Corte', alertaDesvio: false }),
      fila({ etapaId: 'e-2', nombreEtapa: 'Pintura', alertaDesvio: true }),
    ]} />);
    const estados = screen.getAllByRole('status');
    expect(estados).toHaveLength(1);
    expect(estados[0]?.textContent).toBe('Alerta de desvío de horas');
    const filaCorte = screen.getByRole('rowheader', { name: 'Corte' }).parentElement;
    expect(within(filaCorte!).queryByRole('status')).toBeNull();
  });

  it('conserva el orden del DTO y mantiene Sin etapa como fila separada', () => {
    const filas = [
      fila({ etapaId: 'e-2', nombreEtapa: 'Pintura', horasVendidas: '10.00', horasReales: '12.50', desvioHoras: '2.50', porcentajeConsumo: '125.00' }),
      fila({ etapaId: null, nombreEtapa: 'Sin etapa', horasVendidas: '0.00', horasReales: '2.00', desvioHoras: '2.00', porcentajeConsumo: null }),
      fila({ etapaId: 'e-1', nombreEtapa: 'Corte', horasVendidas: '7.50', horasReales: '6.00', desvioHoras: '-1.50', porcentajeConsumo: '80.00' }),
    ];
    render(<TablaComparativaEtapas filas={filas} />);
    const filasRenderizadas = screen.getAllByRole('row').slice(1);
    expect(filasRenderizadas.map((filaRenderizada) => within(filaRenderizada).getByRole('rowheader').textContent))
      .toEqual(['Pintura', 'Sin etapa', 'Corte']);
    expect(screen.getAllByTestId('fila-sin-etapa')).toHaveLength(1);
    const filaSinEtapa = screen.getByTestId('fila-sin-etapa');
    expect(filaSinEtapa.className).toMatch(/sinEtapa/);
    expect(filaSinEtapa.textContent).toContain('0.00');
    expect(within(filaSinEtapa).getByText('—')).toBeDefined();
    expect(screen.queryAllByRole('status')).toHaveLength(0);
  });
});
