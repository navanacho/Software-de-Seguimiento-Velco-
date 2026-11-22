import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TarjetaOrden } from '../../tablero/components/TarjetaOrden.tsx';
import { crearTarjeta } from '../../../../test/tablero/fixtures.ts';

afterEach(cleanup);

describe('TarjetaOrden badge de plano y acceso al detalle (C-07)', () => {
  it('muestra Plano: <codigo> y enlace a /ops/:id', () => {
    render(
      <MemoryRouter>
        <TarjetaOrden tarjeta={crearTarjeta({ id: 'op-9', codigoPlano: 'PL-2026-045' })} onAlternarEtapa={() => {}} />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('badge-plano').textContent).toBe('Plano: PL-2026-045');
    expect(screen.getByRole('link', { name: /ver detalle/i }).getAttribute('href')).toBe('/ops/op-9');
  });

  it('muestra Sin plano en tres tarjetas sin normalizar ni fallar por unicidad', () => {
    const tarjetas = ['op-1', 'op-2', 'op-3'].map((id) => crearTarjeta({ id, codigoPlano: null }));
    render(
      <MemoryRouter>
        {tarjetas.map((tarjeta) => (
          <TarjetaOrden key={tarjeta.id} tarjeta={tarjeta} onAlternarEtapa={() => {}} />
        ))}
      </MemoryRouter>,
    );
    expect(screen.getAllByTestId('badge-plano').map((n) => n.textContent)).toEqual(['Sin plano', 'Sin plano', 'Sin plano']);
  });
});
