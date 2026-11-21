import { describe, expect, it, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { TarjetaOrden } from './TarjetaOrden.tsx';
import { crearTarjeta } from '../../../../test/tablero/fixtures.ts';

afterEach(cleanup);

describe('TarjetaOrden derivados (4.8-4.10)', () => {
  it('muestra avance, diasRestantes y etiquetaPlazo literalmente (RN-GLOBAL-02)', () => {
    render(<TarjetaOrden tarjeta={crearTarjeta({ avance: 67, diasRestantes: 2, etiquetaPlazo: 'Faltan 2 días' })} onAlternarEtapa={() => {}} />);
    expect(screen.getByTestId('tarjeta-avance').textContent).toContain('67');
    expect(screen.getByTestId('tarjeta-dias-restantes').textContent).toContain('2');
    expect(screen.getByTestId('tarjeta-etiqueta-plazo').textContent).toContain('Faltan 2 días');
  });

  it('muestra etiquetas literales Vence hoy, Pasó hace N días y Terminado (RN-SEMAFORO-06)', () => {
    const { rerender } = render(<TarjetaOrden tarjeta={crearTarjeta({ etiquetaPlazo: 'Vence hoy', diasRestantes: 0 })} onAlternarEtapa={() => {}} />);
    expect(screen.getByTestId('tarjeta-etiqueta-plazo').textContent).toContain('Vence hoy');
    rerender(<TarjetaOrden tarjeta={crearTarjeta({ etiquetaPlazo: 'Pasó hace 3 días', diasRestantes: -3 })} onAlternarEtapa={() => {}} />);
    expect(screen.getByTestId('tarjeta-etiqueta-plazo').textContent).toContain('Pasó hace 3 días');
    rerender(<TarjetaOrden tarjeta={crearTarjeta({ etiquetaPlazo: 'Terminado', semaforo: 'Terminado' })} onAlternarEtapa={() => {}} />);
    expect(screen.getByTestId('tarjeta-etiqueta-plazo').textContent).toContain('Terminado');
  });
});
