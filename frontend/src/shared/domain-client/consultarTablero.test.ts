import { describe, expect, it, vi } from 'vitest';
import { consultarTablero } from './consultarTablero.ts';

const envelopeValido = {
  ops: [{
    id: 'op1', numeroOp: 'OT-1', clienteId: 'c1', clienteNombre: 'Cliente', descripcionPieza: 'Pieza',
    etapas: [{ id: 'e1', nombre: 'Corte', ordenSecuencia: 1, completada: false }],
    avance: 0, semaforo: 'En plazo', diasRestantes: 2, etapaAhora: 'Corte', etiquetaPlazo: 'Faltan 2 días',
  }],
  kpis: { total: 1, porEstado: { Terminado: 0, Atrasado: 0, 'En riesgo': 0, 'En plazo': 1 } },
  flujo: [{ etapa: 'Corte', cantidad: 1 }],
};

describe('consultarTablero (2.5-2.7)', () => {
  it('consulta GET /api/ops con URLSearchParams y valida respuesta', async () => {
    const consulta = vi.fn(async (_url: string) => ({ ok: true, json: async () => envelopeValido }));
    const resultado = await consultarTablero({ estado: 'Atrasado', buscar: 'OT-1' }, consulta);
    expect(consulta).toHaveBeenCalledTimes(1);
    expect(String(consulta.mock.calls[0]?.[0])).toContain('/api/ops?');
    expect(String(consulta.mock.calls[0]?.[0])).toContain('estado=Atrasado');
    expect(String(consulta.mock.calls[0]?.[0])).toContain('buscar=OT-1');
    expect(resultado.ops[0]?.numeroOp).toBe('OT-1');
  });

  it('serializa filtros combinados y no envía parámetros vacíos', async () => {
    const consulta = vi.fn(async (_url: string) => ({ ok: true, json: async () => envelopeValido }));
    await consultarTablero({ clienteId: 'c1', etapaAhora: 'Corte', buscar: '' }, consulta);
    const url = String(consulta.mock.calls[0]?.[0]);
    expect(url).toContain('clienteId=c1');
    expect(url).toContain('etapaAhora=Corte');
    expect(url).not.toContain('buscar=');
    expect(url).not.toContain('estado=');
  });

  it('rechaza la promesa cuando el cuerpo es inválido', async () => {
    const consulta = vi.fn(async (_url: string) => ({ ok: true, json: async () => ({ ops: [] }) }));
    await expect(consultarTablero({}, consulta)).rejects.toThrow();
  });
});
