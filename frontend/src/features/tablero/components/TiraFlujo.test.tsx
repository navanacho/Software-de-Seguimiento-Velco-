import { describe, expect, it, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { TiraFlujo } from './TiraFlujo.tsx';

afterEach(cleanup);

describe('TiraFlujo (5.1-5.4)', () => {
  it('muestra un grupo por GrupoFlujo con su cantidad en orden recibido (RN-FLujo-01)', () => {
    render(<TiraFlujo flujo={[{ etapa: 'Soldadura', cantidad: 2 }, { etapa: 'Pintura', cantidad: 1 }]} />);
    const grupos = screen.getAllByTestId('flujo-grupo');
    expect(grupos).toHaveLength(2);
    expect(grupos[0]?.textContent).toContain('Soldadura');
    expect(grupos[0]?.textContent).toContain('2');
    expect(grupos[1]?.textContent).toContain('Pintura');
  });

  it('muestra mensaje cuando flujo vacío', () => {
    render(<TiraFlujo flujo={[]} />);
    expect(screen.getByText(/no hay trabajos en curso/i)).toBeDefined();
  });

  it('no filtra ni reordena: renderiza lo recibido', () => {
    render(<TiraFlujo flujo={[{ etapa: 'B', cantidad: 1 }, { etapa: 'A', cantidad: 3 }]} />);
    const grupos = screen.getAllByTestId('flujo-grupo');
    expect(grupos[0]?.textContent).toContain('B');
    expect(grupos[1]?.textContent).toContain('A');
  });
});
