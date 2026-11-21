import { describe, expect, it, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { TarjetaOrden } from './TarjetaOrden.tsx';
import { crearTarjeta, crearEtapa } from '../../../../test/tablero/fixtures.ts';

afterEach(cleanup);

describe('TarjetaOrden badge ahora (5.5-5.7, RN-AHORA-01)', () => {
  it('muestra badge solo en etapa pendiente cuyo nombre coincide con etapaAhora', () => {
    render(<TarjetaOrden tarjeta={crearTarjeta({
      etapaAhora: 'Soldadura',
      etapas: [crearEtapa({ id: 'e1', nombre: 'Corte', ordenSecuencia: 1, completada: true }), crearEtapa({ id: 'e2', nombre: 'Soldadura', ordenSecuencia: 2, completada: false })],
    })} onAlternarEtapa={() => {}} />);
    const soldadura = screen.getByText('Soldadura').closest('li');
    const corte = screen.getByText('Corte').closest('li');
    expect(soldadura?.textContent).toMatch(/ahora/i);
    expect(corte?.textContent).not.toMatch(/ahora/i);
  });

  it('no muestra badge cuando etapaAhora es Todo listo', () => {
    render(<TarjetaOrden tarjeta={crearTarjeta({ etapaAhora: 'Todo listo', avance: 100, semaforo: 'Terminado', etapas: [crearEtapa({ completada: true })] })} onAlternarEtapa={() => {}} />);
    expect(screen.queryByText(/ahora/i)).toBeNull();
  });

  it('respeta ordenSecuencia recibido aunque el array venga desordenado', () => {
    render(<TarjetaOrden tarjeta={crearTarjeta({
      etapas: [crearEtapa({ id: 'e2', nombre: 'Soldadura', ordenSecuencia: 2, completada: false }), crearEtapa({ id: 'e1', nombre: 'Corte', ordenSecuencia: 1, completada: false })],
      etapaAhora: 'Corte',
    })} onAlternarEtapa={() => {}} />);
    const items = screen.getAllByRole('listitem');
    expect(items[0]?.textContent).toContain('Corte');
    expect(items[1]?.textContent).toContain('Soldadura');
  });
});
