import { describe, expect, it, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { EstadoVacioTablero } from './EstadoVacioTablero.tsx';

afterEach(cleanup);

describe('EstadoVacioTablero (6.14-6.16)', () => {
  it('muestra acciones limpiar filtros y recargar tablero', () => {
    render(<EstadoVacioTablero hayFiltrosActivos={true} onLimpiar={() => {}} onRecargar={() => {}} />);
    expect(screen.getByRole('button', { name: /limpiar filtros/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /recargar tablero/i })).toBeDefined();
  });

  it('muestra recargar cuando no hay filtros', () => {
    render(<EstadoVacioTablero hayFiltrosActivos={false} onLimpiar={() => {}} onRecargar={() => {}} />);
    expect(screen.getByRole('button', { name: /recargar tablero/i })).toBeDefined();
  });

  it('dispara handlers al hacer click en limpiar filtros y recargar tablero', () => {
    const onLimpiar = vi.fn();
    const onRecargar = vi.fn();
    render(<EstadoVacioTablero hayFiltrosActivos={true} onLimpiar={onLimpiar} onRecargar={onRecargar} />);
    fireEvent.click(screen.getByRole('button', { name: /limpiar filtros/i }));
    fireEvent.click(screen.getByRole('button', { name: /recargar tablero/i }));
    expect(onLimpiar).toHaveBeenCalledTimes(1);
    expect(onRecargar).toHaveBeenCalledTimes(1);
  });
});
