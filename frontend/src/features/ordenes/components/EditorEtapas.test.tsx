import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { EditorEtapas } from './EditorEtapas.tsx';
import type { EtapaFormulario } from '../tiposFormulario.ts';

afterEach(cleanup);

const etapas: readonly EtapaFormulario[] = [
  { id: 'e-1', nombre: 'Corte', horasVendidas: '7.50' },
  { id: 'e-2', nombre: 'Soldadura', horasVendidas: '0.00' },
  { id: 'e-3', nombre: 'Mecanizado', horasVendidas: '7.50' },
  { id: 'e-4', nombre: 'Pintura', horasVendidas: '0.00' },
  { id: 'e-5', nombre: 'Entrega', horasVendidas: '0.00' },
];

type Props = Parameters<typeof EditorEtapas>[0];

function renderEditor(props: Partial<Props> = {}) {
  const onChange = vi.fn();
  render(<EditorEtapas etapas={etapas} onChange={onChange} {...props} />);
  return { onChange };
}

function renderEditorConEstado(props: Partial<Props> = {}) {
  const onChange = vi.fn();
  function Harness() {
    const [actuales, setActuales] = useState<readonly EtapaFormulario[]>(props.etapas ?? etapas);
    return (
      <EditorEtapas
        {...props}
        etapas={actuales}
        onChange={(nuevas, modificadas) => {
          onChange(nuevas, modificadas);
          setActuales(nuevas);
        }}
      />
    );
  }
  render(<Harness />);
  return { onChange };
}

describe('EditorEtapas (sección 5, RN-ETAPA-01/02/03)', () => {
  it('muestra la precarga canónica en orden', () => {
    const nuevas = etapas.map(({ nombre, horasVendidas }) => ({ nombre, horasVendidas }));
    renderEditor({ etapas: nuevas });
    expect((screen.getByLabelText('Etapa 1') as HTMLInputElement).value).toBe('Corte');
    expect((screen.getByLabelText('Etapa 3') as HTMLInputElement).value).toBe('Mecanizado');
    expect((screen.getByLabelText('Etapa 5') as HTMLInputElement).value).toBe('Entrega');
  });

  it('muestra las horas de etapas persistidas como texto no editable', () => {
    const { onChange } = renderEditor();
    expect(screen.queryByLabelText('Horas vendidas 1')).toBeNull();
    expect(screen.queryByLabelText('Horas vendidas 2')).toBeNull();
    expect(screen.getByTestId('horas-etapa-0').textContent).toBe('7.50');
    expect(screen.getByTestId('horas-etapa-1').textContent).toBe('0.00');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('permite editar las horas de una etapa nueva', () => {
    const { onChange } = renderEditor({ etapas: [{ nombre: 'Corte', horasVendidas: '0.00' }] });
    const campo = screen.getByLabelText('Horas vendidas 1') as HTMLInputElement;
    expect(campo.readOnly).toBe(false);
    fireEvent.change(campo, { target: { value: '9.25' } });
    expect(onChange).toHaveBeenCalledWith([{ nombre: 'Corte', horasVendidas: '9.25' }], true);
  });

  it('agrega una etapa y repinta con la colección devuelta por el servidor', async () => {
    const servidas = [...etapas, { id: 'e-6', nombre: 'Pulido', horasVendidas: '0.00' }];
    const onAltaEtapa = vi.fn(async () => servidas);
    const { onChange } = renderEditorConEstado({ onAltaEtapa });

    fireEvent.change(screen.getByLabelText('Nueva etapa'), { target: { value: 'Pulido' } });
    fireEvent.click(screen.getByRole('button', { name: /agregar etapa/i }));

    await waitFor(() => expect(onAltaEtapa).toHaveBeenCalledWith('Pulido', '0.00'));
    expect(onChange).toHaveBeenCalledWith(servidas, false);
    expect(screen.getByTestId('nombre-etapa-5').textContent).toBe('Pulido');
  });

  it('quita la etapa indicada y repinta con la colección devuelta por el servidor', async () => {
    const servidas = etapas.filter((etapa) => etapa.id !== 'e-5');
    const onBajaEtapa = vi.fn(async () => servidas);
    const { onChange } = renderEditorConEstado({ onBajaEtapa });

    fireEvent.click(screen.getAllByRole('button', { name: /quitar/i })[4]!);

    await waitFor(() => expect(onBajaEtapa).toHaveBeenCalledWith('e-5'));
    expect(onChange).toHaveBeenCalledWith(servidas, false);
    expect(screen.queryByTestId('nombre-etapa-4')).toBeNull();
  });

  it('rechaza nombres vacíos y mayores a 100 caracteres sin pedir alta', () => {
    const onAltaEtapa = vi.fn(async () => etapas);
    renderEditor({ onAltaEtapa });

    fireEvent.click(screen.getByRole('button', { name: /agregar etapa/i }));
    expect(screen.getByRole('alert').textContent).toMatch(/1 y 100 caracteres/);

    fireEvent.change(screen.getByLabelText('Nueva etapa'), { target: { value: 'x'.repeat(101) } });
    fireEvent.click(screen.getByRole('button', { name: /agregar etapa/i }));
    expect(onAltaEtapa).not.toHaveBeenCalled();
  });

  it('mueve al inicio con la secuencia servida, sin renombrar ni slider', async () => {
    const servidas = [etapas[2]!, etapas[0]!, etapas[1]!, etapas[3]!, etapas[4]!];
    const onReordenarEtapa = vi.fn(async () => servidas);
    const { onChange } = renderEditorConEstado({ onReordenarEtapa });

    fireEvent.click(screen.getByRole('button', { name: 'Mover Mecanizado al inicio' }));

    await waitFor(() => expect(onReordenarEtapa).toHaveBeenCalledWith('e-3', 1));
    expect(onChange).toHaveBeenCalledWith(servidas, false);
    expect(screen.getByTestId('nombre-etapa-0').textContent).toBe('Mecanizado');
    expect(screen.queryByLabelText('Etapa 1')).toBeNull();
    expect(document.querySelector('input[type="range"]')).toBeNull();
  });

  it('mantiene el orden servido y avisa el error si el reorden falla', async () => {
    const onReordenarEtapa = vi.fn(async () => { throw new Error('No se pudo reordenar.'); });
    const { onChange } = renderEditorConEstado({ onReordenarEtapa });

    fireEvent.click(screen.getByRole('button', { name: 'Mover Mecanizado al inicio' }));

    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('No se pudo reordenar.'));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByTestId('nombre-etapa-0').textContent).toBe('Corte');
  });
});
