import { describe, expect, it, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { TarjetaOrden } from './TarjetaOrden.tsx';
import { crearTarjeta } from '../../../../test/tablero/fixtures.ts';

afterEach(cleanup);

describe('TarjetaOrden semáforo (4.4-4.7)', () => {
  it('aplica clase gris para Terminado (RN-SEMAFORO-01)', () => {
    render(<TarjetaOrden tarjeta={crearTarjeta({ semaforo: 'Terminado' })} onAlternarEtapa={() => {}} />);
    expect(screen.getByTestId('tarjeta-orden').className).toMatch(/gris|terminado/i);
  });

  it('mapea Atrasado->rojo, En riesgo->amarillo, En plazo->verde (RN-SEMAFORO-02..04)', () => {
    const { rerender } = render(<TarjetaOrden tarjeta={crearTarjeta({ semaforo: 'Atrasado' })} onAlternarEtapa={() => {}} />);
    expect(screen.getByTestId('tarjeta-orden').className).toMatch(/rojo|atrasado/i);
    rerender(<TarjetaOrden tarjeta={crearTarjeta({ semaforo: 'En riesgo' })} onAlternarEtapa={() => {}} />);
    expect(screen.getByTestId('tarjeta-orden').className).toMatch(/amarillo|riesgo/i);
    rerender(<TarjetaOrden tarjeta={crearTarjeta({ semaforo: 'En plazo' })} onAlternarEtapa={() => {}} />);
    expect(screen.getByTestId('tarjeta-orden').className).toMatch(/verde|plazo/i);
  });

  it('respeta precedencia del dominio: Terminado vencido sigue gris (RN-SEMAFORO-05)', () => {
    render(<TarjetaOrden tarjeta={crearTarjeta({ semaforo: 'Terminado', diasRestantes: -5, etiquetaPlazo: 'Terminado' })} onAlternarEtapa={() => {}} />);
    expect(screen.getByTestId('tarjeta-orden').className).toMatch(/gris|terminado/i);
  });
});
