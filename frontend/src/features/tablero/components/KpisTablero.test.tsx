import { describe, expect, it, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { KpisTablero } from './KpisTablero.tsx';

afterEach(cleanup);

describe('KpisTablero (8.1-8.3)', () => {
  it('muestra total y los cuatro conteos por estado', () => {
    render(<KpisTablero kpis={{ total: 4, porEstado: { Terminado: 1, Atrasado: 1, 'En riesgo': 0, 'En plazo': 2 } }} />);
    expect(screen.getByTestId('kpi-total').textContent).toContain('4');
    expect(screen.getByTestId('kpi-Terminado').textContent).toContain('1');
    expect(screen.getByTestId('kpi-Atrasado').textContent).toContain('1');
    expect(screen.getByTestId('kpi-En riesgo').textContent).toContain('0');
    expect(screen.getByTestId('kpi-En plazo').textContent).toContain('2');
  });

  it('muestra ceros con total 0', () => {
    render(<KpisTablero kpis={{ total: 0, porEstado: { Terminado: 0, Atrasado: 0, 'En riesgo': 0, 'En plazo': 0 } }} />);
    expect(screen.getByTestId('kpi-total').textContent).toContain('0');
  });
});
