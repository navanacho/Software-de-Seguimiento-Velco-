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

describe('TarjetaOrden termómetro y alerta (2.1)', () => {
  it('muestra el consumo del DTO como porcentaje sin ceros finales', () => {
    render(<TarjetaOrden
      tarjeta={crearTarjeta({
        horasRealesTotales: '32.00', horasVendidasTotales: '40.00', porcentajeConsumo: '80.00',
      })}
      onAlternarEtapa={() => {}}
    />);
    const consumo = screen.getByTestId('tarjeta-consumo').textContent;
    expect(consumo).toContain('80%');
    expect(consumo).not.toContain('80.00%');
  });

  it('muestra guion cuando el porcentaje de consumo es nulo', () => {
    render(<TarjetaOrden tarjeta={crearTarjeta({ porcentajeConsumo: null })} onAlternarEtapa={() => {}} />);
    expect(screen.getByTestId('tarjeta-consumo').textContent).toContain('—');
  });

  it('muestra el badge de desvío con role status cuando alertaDesvio es true', () => {
    render(<TarjetaOrden tarjeta={crearTarjeta({ alertaDesvio: true })} onAlternarEtapa={() => {}} />);
    const badge = screen.getByRole('status');
    expect(badge.textContent).toBe('Alerta de desvío de horas');
  });
});

describe('TarjetaOrden derivados sin cálculo local (2.3)', () => {
  it('no muestra badge cuando alertaDesvio es false', () => {
    render(<TarjetaOrden
      tarjeta={crearTarjeta({ alertaDesvio: false, porcentajeConsumo: '80.00' })}
      onAlternarEtapa={() => {}}
    />);
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.getByTestId('tarjeta-consumo').textContent).toContain('80%');
  });

  it('muestra guion y badge juntos sin NaN, Infinity ni 0.00%', () => {
    render(<TarjetaOrden
      tarjeta={crearTarjeta({
        horasVendidasTotales: '0.00', horasRealesTotales: '8.00',
        porcentajeConsumo: null, alertaDesvio: true,
      })}
      onAlternarEtapa={() => {}}
    />);
    const consumo = screen.getByTestId('tarjeta-consumo').textContent ?? '';
    expect(consumo).toContain('—');
    expect(consumo).not.toMatch(/NaN|Infinity|0\.00%/);
    expect(screen.getByRole('status').textContent).toBe('Alerta de desvío de horas');
  });

  it('respeta los decimales significativos que trae el DTO', () => {
    render(<TarjetaOrden tarjeta={crearTarjeta({ porcentajeConsumo: '95.01' })} onAlternarEtapa={() => {}} />);
    expect(screen.getByTestId('tarjeta-consumo').textContent).toContain('95.01%');
  });
});

describe('TarjetaOrden ancho animado del termómetro (2.5-2.7)', () => {
  it('usa porcentajeConsumo del DTO como ancho y transición verificable', () => {
    render(<TarjetaOrden tarjeta={crearTarjeta({ porcentajeConsumo: '80.00' })} onAlternarEtapa={() => {}} />);
    const barra = screen.getByTestId('termometro-consumo');
    expect(barra.style.width).toBe('80%');
    expect(barra.style.transition).toContain('width');
  });

  it('deja el ancho en 0% sin NaN cuando porcentajeConsumo es null', () => {
    render(<TarjetaOrden tarjeta={crearTarjeta({ porcentajeConsumo: null })} onAlternarEtapa={() => {}} />);
    const barra = screen.getByTestId('termometro-consumo');
    expect(barra.style.width).toBe('0%');
    expect(barra.style.width).not.toContain('NaN');
  });

  it('limita el ancho a 100% sin alterar el texto del DTO', () => {
    render(<TarjetaOrden tarjeta={crearTarjeta({ porcentajeConsumo: '120.00' })} onAlternarEtapa={() => {}} />);
    expect(screen.getByTestId('termometro-consumo').style.width).toBe('100%');
    expect(screen.getByTestId('tarjeta-consumo').textContent).toContain('120%');
  });

  it('actualiza el ancho al rerender sin animar la barra de horas de C-09', () => {
    const { rerender } = render(<TarjetaOrden tarjeta={crearTarjeta({ porcentajeConsumo: '80.00' })} onAlternarEtapa={() => {}} />);
    expect(screen.getByTestId('termometro-consumo').style.width).toBe('80%');
    rerender(<TarjetaOrden tarjeta={crearTarjeta({ porcentajeConsumo: '95.01' })} onAlternarEtapa={() => {}} />);
    expect(screen.getByTestId('termometro-consumo').style.width).toBe('95.01%');
    expect(screen.getByTestId('barra-horas').style.transition).toBe('');
  });
});
