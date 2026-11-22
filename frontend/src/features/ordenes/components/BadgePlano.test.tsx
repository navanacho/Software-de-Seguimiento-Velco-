import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { BadgePlano } from './BadgePlano.tsx';

afterEach(cleanup);

describe('BadgePlano (RN-OP-05/06, DD-11)', () => {
  it('muestra Plano: <codigo> sin normalizar el valor', () => {
    render(<BadgePlano codigoPlano="pl-2026-045" />);
    expect(screen.getByTestId('badge-plano').textContent).toBe('Plano: pl-2026-045');
  });

  it('muestra Sin plano cuando el DTO trae null', () => {
    render(<BadgePlano codigoPlano={null} />);
    const texto = screen.getByTestId('badge-plano').textContent;
    expect(texto).toBe('Sin plano');
    expect(texto).not.toContain('null');
  });
});
