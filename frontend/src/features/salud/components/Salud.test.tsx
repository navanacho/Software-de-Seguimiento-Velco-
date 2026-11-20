import { render, screen } from '@testing-library/react';
import { RUTA_SALUD } from '@velco/domain';
import { describe, expect, it } from 'vitest';
import { Salud } from './Salud.tsx';

describe('componente Salud', () => {
  it('muestra el estado usando el contrato compartido', () => {
    const { container } = render(<Salud respuesta={{ estado: 'ok' }} />);
    expect(screen.getByText('Estado: ok')).toBeDefined();
    expect(container.querySelector('section')?.getAttribute('data-ruta')).toBe(RUTA_SALUD);
  });

  it('compone clases condicionales del CSS Module', () => {
    const { container } = render(<Salud respuesta={{ estado: 'ok' }} />);
    const clases = container.querySelector('section')?.className ?? '';
    expect(clases).toContain('tarjeta');
    expect(clases).toContain('operativa');
  });
});
