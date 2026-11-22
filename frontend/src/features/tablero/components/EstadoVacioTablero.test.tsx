import { describe, expect, it, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { EstadoVacioTablero } from './EstadoVacioTablero.tsx';

afterEach(cleanup);

describe('EstadoVacioTablero (6.14-6.16)', () => {
  it('muestra Nueva OP, limpiar filtros y recargar tablero', () => {
    render(
      <EstadoVacioTablero
        hayFiltrosActivos={true}
        onNuevaOp={() => {}}
        onLimpiar={() => {}}
        onRecargar={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: /nueva op/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /limpiar filtros/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /recargar tablero/i })).toBeDefined();
  });

  it('muestra Nueva OP y recargar cuando no hay filtros', () => {
    render(
      <EstadoVacioTablero
        hayFiltrosActivos={false}
        onNuevaOp={() => {}}
        onLimpiar={() => {}}
        onRecargar={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: /nueva op/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /recargar tablero/i })).toBeDefined();
    expect(screen.queryByRole('button', { name: /limpiar filtros/i })).toBeNull();
  });

  it('dispara handlers al hacer click en las tres acciones', () => {
    const onNuevaOp = vi.fn();
    const onLimpiar = vi.fn();
    const onRecargar = vi.fn();
    render(
      <EstadoVacioTablero
        hayFiltrosActivos={true}
        onNuevaOp={onNuevaOp}
        onLimpiar={onLimpiar}
        onRecargar={onRecargar}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /nueva op/i }));
    fireEvent.click(screen.getByRole('button', { name: /limpiar filtros/i }));
    fireEvent.click(screen.getByRole('button', { name: /recargar tablero/i }));
    expect(onNuevaOp).toHaveBeenCalledTimes(1);
    expect(onLimpiar).toHaveBeenCalledTimes(1);
    expect(onRecargar).toHaveBeenCalledTimes(1);
  });
});
