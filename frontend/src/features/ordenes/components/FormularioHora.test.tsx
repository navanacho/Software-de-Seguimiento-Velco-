import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { EtapaDetalleDTO } from '../../../shared/domain-client/tipos.ts';
import { FormularioHora } from './FormularioHora.tsx';

const etapas: readonly EtapaDetalleDTO[] = [];
const sinEnviar = () => undefined;
const sinCancelar = () => undefined;

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('FormularioHora — fecha precargada (CRITICAL-2)', () => {
  it('precarga el día inyectado en alta', () => {
    render(
      <FormularioHora etapas={etapas} hoy="2026-11-24" onSubmit={sinEnviar} onCancelar={sinCancelar} />,
    );
    expect((screen.getByLabelText(/fecha/i) as HTMLInputElement).value).toBe('2026-11-24');
  });

  it('respeta la fecha de la parte en edición aunque se inyecte otro día', () => {
    render(
      <FormularioHora
        etapas={etapas}
        hoy="2026-11-24"
        parte={{
          id: 'h-1', ordenId: 'op-1', etapaId: null, operario: 'Ana', fecha: '2026-03-05',
          horas: '2.50', createdAt: '2026-03-05T10:00:00.000Z', observacion: null,
        }}
        onSubmit={sinEnviar}
        onCancelar={sinCancelar}
      />,
    );
    expect((screen.getByLabelText(/fecha/i) as HTMLInputElement).value).toBe('2026-03-05');
  });

  it('usa la fecha del reloj simulado cuando no se inyecta día', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 24, 12, 0));
    render(<FormularioHora etapas={etapas} onSubmit={sinEnviar} onCancelar={sinCancelar} />);
    expect((screen.getByLabelText(/fecha/i) as HTMLInputElement).value).toBe('2026-11-24');
  });
});
