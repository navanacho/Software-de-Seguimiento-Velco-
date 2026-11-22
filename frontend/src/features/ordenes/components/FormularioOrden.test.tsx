import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FormularioOrden } from './FormularioOrden.tsx';
import type { ValoresFormulario } from '../tiposFormulario.ts';

afterEach(cleanup);

function renderForm(props: Partial<Parameters<typeof FormularioOrden>[0]> = {}) {
  const onGuardar = vi.fn();
  const onAltaCliente = vi.fn(async (nombre: string) => ({ id: `c-${nombre}`, nombre }));
  render(
    <FormularioOrden
      modo="alta"
      clientes={[{ id: 'c-1', nombre: 'ACME' }]}
      onGuardar={onGuardar}
      onAltaCliente={onAltaCliente}
      {...props}
    />,
  );
  return { onGuardar, onAltaCliente };
}

function completarCamposBasicos() {
  fireEvent.change(screen.getByLabelText(/n° op/i), { target: { value: '1872' } });
  fireEvent.change(screen.getByLabelText(/id de plano/i), { target: { value: 'PL-2026-046' } });
  fireEvent.change(screen.getByLabelText(/descripción de la pieza/i), { target: { value: 'Eje B' } });
  fireEvent.change(screen.getByLabelText(/fecha de entrega/i), { target: { value: '2026-12-10' } });
  fireEvent.change(screen.getByLabelText(/monto vendido/i), { target: { value: '1500.00' } });
  fireEvent.change(screen.getByLabelText(/^cliente$/i), { target: { value: 'c-1' } });
}

describe('FormularioOrden (sección 4, D1/D2/D3/D6/D9)', () => {
  it('muestra placeholder literal del plano, cinco etapas precargadas y fecha de ingreso informativa', () => {
    renderForm({ fechaIngreso: '2026-11-22' });
    expect((screen.getByLabelText(/id de plano/i) as HTMLInputElement).placeholder).toBe('Opcional — Ej: PL-2026-045');
    expect((screen.getByLabelText('Etapa 1') as HTMLInputElement).value).toBe('Corte');
    expect((screen.getByLabelText('Etapa 5') as HTMLInputElement).value).toBe('Entrega');
    expect(screen.getByText(/Fecha de ingreso: 2026-11-22/)).toBeDefined();
    expect(screen.queryByLabelText(/fecha de ingreso/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /borrar/i })).toBeNull();
  });

  it('envía valores tipados con plano, etapas y material MP como strings decimales', () => {
    const { onGuardar } = renderForm();
    completarCamposBasicos();
    fireEvent.change(screen.getByLabelText(/horas vendidas 1/i), { target: { value: '7.50' } });
    fireEvent.change(screen.getByLabelText(/tipo de material/i), { target: { value: 'MP' } });
    fireEvent.change(screen.getByLabelText(/descripción del material/i), { target: { value: 'Acero' } });
    fireEvent.change(screen.getByLabelText(/^cantidad$/i), { target: { value: '2.00' } });
    fireEvent.change(screen.getByLabelText(/costo unitario cotizado/i), { target: { value: '10.50' } });
    fireEvent.click(screen.getByRole('button', { name: /agregar material/i }));
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));

    expect(onGuardar).toHaveBeenCalledTimes(1);
    const valores = onGuardar.mock.calls[0]![0] as ValoresFormulario;
    expect(valores.numeroOp).toBe('1872');
    expect(valores.codigoPlano).toBe('PL-2026-046');
    expect(valores.clienteNombre).toBe('ACME');
    expect(valores.materiales).toHaveLength(1);
    expect(valores.materiales[0]).toMatchObject({ tipo: 'MP', cantidad: '2.00', costoUnitarioCotizado: '10.50' });
    expect(valores.etapas[0]).toMatchObject({ nombre: 'Corte', horasVendidas: '7.50' });
  });

  it('no envía la petición con numero_op vacío y marca el campo', () => {
    const { onGuardar } = renderForm();
    completarCamposBasicos();
    fireEvent.change(screen.getByLabelText(/n° op/i), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));
    expect(onGuardar).not.toHaveBeenCalled();
    expect(screen.getByTestId('error-numeroOp')).toBeDefined();
  });

  it('convierte el plano vacío en null y rechaza fecha inválida sin enviar', () => {
    const { onGuardar } = renderForm();
    completarCamposBasicos();
    fireEvent.change(screen.getByLabelText(/id de plano/i), { target: { value: '   ' } });
    fireEvent.change(screen.getByLabelText(/fecha de entrega/i), { target: { value: '10-12-2026' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));
    expect(onGuardar).not.toHaveBeenCalled();
    expect(screen.getByTestId('error-fechaEntrega')).toBeDefined();

    fireEvent.change(screen.getByLabelText(/fecha de entrega/i), { target: { value: '2026-12-10' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));
    const valores = onGuardar.mock.calls[0]![0] as ValoresFormulario;
    expect(valores.codigoPlano).toBeNull();
  });

  it('da de alta un cliente inline sin duplicar el existente', async () => {
    const { onGuardar, onAltaCliente } = renderForm();
    completarCamposBasicos();
    fireEvent.change(screen.getByLabelText(/^cliente$/i), { target: { value: '__nuevo__' } });
    fireEvent.change(screen.getByLabelText(/nombre del cliente/i), { target: { value: 'Nueva SA' } });
    fireEvent.click(screen.getByRole('button', { name: /confirmar cliente/i }));
    await waitFor(() => expect(onAltaCliente).toHaveBeenCalledWith('Nueva SA'));
    expect((screen.getByLabelText(/^cliente$/i) as HTMLSelectElement).value).toBe('c-Nueva SA');
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));
    const valores = onGuardar.mock.calls[0]![0] as ValoresFormulario;
    expect(valores.clienteNombre).toBe('Nueva SA');
  });

  it('rechaza tipo de material inválido sin agregarlo ni ofrecer edición', () => {
    renderForm();
    fireEvent.change(screen.getByLabelText(/tipo de material/i), { target: { value: 'INVALIDO' } });
    fireEvent.change(screen.getByLabelText(/descripción del material/i), { target: { value: 'Acero' } });
    fireEvent.change(screen.getByLabelText(/^cantidad$/i), { target: { value: '2.00' } });
    fireEvent.change(screen.getByLabelText(/costo unitario cotizado/i), { target: { value: '10.50' } });
    fireEvent.click(screen.getByRole('button', { name: /agregar material/i }));
    expect(screen.getByTestId('error-material')).toBeDefined();
    expect(screen.queryByTestId('material-agregado')).toBeNull();
    expect(screen.queryByRole('button', { name: /editar material/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /borrar material/i })).toBeNull();
  });

  it('no duplica el mensaje general cuando coincide con un error de campo', () => {
    const mensaje = 'El ID de plano PL-2026-045 ya está asignado a la OP 1871.';
    renderForm({ errores: { campos: { codigoPlano: mensaje }, mensaje } });
    expect(screen.getAllByText(mensaje)).toHaveLength(1);
  });
});
