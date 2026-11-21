import { describe, expect, it, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { FiltrosTablero } from './FiltrosTablero.tsx';

afterEach(cleanup);

describe('FiltrosTablero (6.1-6.7)', () => {
  it('muestra selector de estado con los cuatro literales', () => {
    render(<FiltrosTablero filtros={{}} clientes={[]} etapas={[]} onChange={() => {}} onLimpiar={() => {}} />);
    const select = screen.getByLabelText(/estado/i) as HTMLSelectElement;
    const options = Array.from(select.options).map((o) => o.textContent);
    expect(options).toEqual(expect.arrayContaining(['Terminado', 'Atrasado', 'En riesgo', 'En plazo']));
  });

  it('emite cambio de estado y buscar', () => {
    const onChange = vi.fn();
    render(<FiltrosTablero filtros={{}} clientes={[]} etapas={[]} onChange={onChange} onLimpiar={() => {}} />);
    fireEvent.change(screen.getByLabelText(/estado/i), { target: { value: 'Atrasado' } });
    fireEvent.change(screen.getByLabelText(/buscar/i), { target: { value: 'OT-1' } });
    expect(onChange).toHaveBeenCalled();
  });

  it('mantiene opciones de cliente base aunque filtro activo', () => {
    render(<FiltrosTablero filtros={{ clienteId: 'c1' }} clientes={[{ clienteId: 'c1', clienteNombre: 'A' }, { clienteId: 'c2', clienteNombre: 'B' }]} etapas={['Corte']} onChange={() => {}} onLimpiar={() => {}} />);
    const select = screen.getByLabelText(/cliente/i) as HTMLSelectElement;
    const values = Array.from(select.options).map((o) => o.value);
    expect(values).toContain('c1');
    expect(values).toContain('c2');
  });
});
