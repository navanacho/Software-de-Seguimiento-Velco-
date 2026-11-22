import { describe, expect, it, vi } from 'vitest';
import { actualizarEtapaRemota } from './actualizarEtapaRemota.ts';

const tarjetaValida = {
  id: 'op1', numeroOp: 'OT-1', codigoPlano: null, clienteId: 'c1', clienteNombre: 'Cliente', descripcionPieza: 'Pieza',
  etapas: [{ id: 'e1', nombre: 'Corte', ordenSecuencia: 1, completada: true }],
  avance: 100, semaforo: 'Terminado', diasRestantes: 2, etapaAhora: 'Todo listo', etiquetaPlazo: 'Terminado',
};

describe('actualizarEtapaRemota (2.8-2.9)', () => {
  it('envía PATCH con { completada } a la ruta correcta', async () => {
    const consulta = vi.fn(async (_url: string, init?: RequestInit) => {
      expect(init?.method).toBe('PATCH');
      expect(init?.body).toBe(JSON.stringify({ completada: true }));
      return { ok: true, json: async () => tarjetaValida };
    });
    const resultado = await actualizarEtapaRemota({ ordenId: 'op1', etapaId: 'e1', completada: true }, consulta);
    expect(consulta).toHaveBeenCalledWith('/api/ops/op1/etapas/e1', expect.any(Object));
    expect(resultado.etapaAhora).toBe('Todo listo');
  });

  it('rechaza si la respuesta no es una tarjeta válida', async () => {
    const consulta = vi.fn(async () => ({ ok: true, json: async () => ({ id: 'x' }) }));
    await expect(actualizarEtapaRemota({ ordenId: 'op1', etapaId: 'e1', completada: false }, consulta)).rejects.toThrow();
  });

  it('rechaza si la respuesta HTTP no es ok', async () => {
    const consulta = vi.fn(async () => ({ ok: false, json: async () => ({}) }));
    await expect(actualizarEtapaRemota({ ordenId: 'op1', etapaId: 'e1', completada: true }, consulta)).rejects.toThrow();
  });
});
