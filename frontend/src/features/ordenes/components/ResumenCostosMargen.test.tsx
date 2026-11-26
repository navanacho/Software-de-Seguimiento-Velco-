import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ResumenCostosMargen } from './ResumenCostosMargen.tsx';
import type { DetalleOpDTO } from '../../../shared/domain-client/tipos.ts';

type Props = Pick<
  DetalleOpDTO,
  'montoVendido' | 'costoMaterialesCotizado' | 'costoMaterialesReal' | 'margenReal' | 'tasaGlobalNoConfigurada'
>;

function valores(parcial: Partial<Props> = {}): Props {
  return {
    montoVendido: '1000.00',
    costoMaterialesCotizado: '200.00',
    costoMaterialesReal: '240.00',
    margenReal: '160.00',
    tasaGlobalNoConfigurada: false,
    ...parcial,
  };
}

afterEach(cleanup);

describe('ResumenCostosMargen (spec analitica-rentabilidad-ui, D6)', () => {
  it('muestra importes y margen del DTO con dos decimales, sin usar el costo cotizado como real', () => {
    render(<ResumenCostosMargen {...valores()} />);

    expect(screen.getByText('1000.00')).toBeDefined();
    expect(screen.getByText('200.00')).toBeDefined();
    expect(screen.getByText('240.00')).toBeDefined();
    expect(screen.getByText('160.00')).toBeDefined();
  });

  it('muestra el margen negativo con su signo y dos decimales', () => {
    render(<ResumenCostosMargen {...valores({ margenReal: '-33.7500' })} />);

    expect(screen.getByText('-33.75')).toBeDefined();
  });

  it('avisa que el valor hora estándar es 0.00 y debe configurarse sin alterar el margen', () => {
    render(<ResumenCostosMargen {...valores({ tasaGlobalNoConfigurada: true })} />);

    const aviso = screen.getByRole('status');
    expect(aviso.textContent).toContain('0.00');
    expect(aviso.textContent).toMatch(/configurarse/i);
    expect(screen.getByText('160.00')).toBeDefined();
  });

  it('conserva un margen distinto junto a la advertencia de tasa global', () => {
    render(<ResumenCostosMargen {...valores({ margenReal: '760.00', tasaGlobalNoConfigurada: true })} />);

    expect(screen.getByText('760.00')).toBeDefined();
    expect(screen.getByRole('status').textContent).toContain('0.00');
    expect(screen.queryByText('160.00')).toBeNull();
  });

  it('no muestra aviso cuando la tasa global está configurada', () => {
    render(<ResumenCostosMargen {...valores({ tasaGlobalNoConfigurada: false })} />);

    expect(screen.queryByRole('status')).toBeNull();
  });
});
