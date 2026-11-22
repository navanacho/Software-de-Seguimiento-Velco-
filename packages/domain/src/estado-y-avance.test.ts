import { describe, expect, it } from 'vitest';
import {
  agruparFlujo,
  calcularAvance,
  calcularSemaforo,
  construirTarjetaOrden,
  diasRestantes,
  etapaAhora,
} from '@velco/domain';
import type { OrdenTrabajo } from '@velco/domain';

const orden: OrdenTrabajo = {
  id: 'op-smoke',
  numeroOp: 'OT-SMOKE',
  codigoPlano: null,
  clienteId: 'cli-smoke',
  descripcionPieza: 'Pieza smoke',
  fechaIngreso: '2026-03-01',
  fechaEntrega: '2026-03-12',
  montoVendido: '1000.00',
  observaciones: null,
  createdAt: '2026-03-01T00:00:00.000Z',
  updatedAt: '2026-03-01T00:00:00.000Z',
};

const contexto = {
  hoy: '2026-03-08T12:00:00.000Z',
  zonaHoraria: 'America/Argentina/Mendoza',
  diasAlertaRiesgo: 3,
  porcentajeAvanceRiesgo: 80,
};

describe('superficie publica del dominio de estado y avance', () => {
  it('exporta las reglas puras y el constructor del DTO desde @velco/domain', () => {
    expect(calcularAvance([])).toBe(0);
    expect(etapaAhora([])).toBe('Todo listo');
    expect(agruparFlujo([])).toEqual([]);
    expect(diasRestantes(orden, contexto)).toBe(4);
    expect(calcularSemaforo(orden, [], contexto)).toBe('En plazo');
    expect(construirTarjetaOrden(orden, [], contexto).numeroOp).toBe('OT-SMOKE');
  });
});
