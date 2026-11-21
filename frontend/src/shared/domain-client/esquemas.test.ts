import { describe, expect, it } from 'vitest';
import { EsquemaRespuestaListadoTablero, EsquemaTarjetaOrden } from './esquemas.ts';

const tarjetaValida = {
  id: 'op1', numeroOp: 'OT-1', clienteId: 'c1', clienteNombre: 'Cliente', descripcionPieza: 'Pieza',
  etapas: [{ id: 'e1', nombre: 'Corte', ordenSecuencia: 1, completada: false }],
  avance: 0, semaforo: 'En plazo', diasRestantes: 2, etapaAhora: 'Corte', etiquetaPlazo: 'Faltan 2 días',
};

const envelopeValido = {
  ops: [tarjetaValida],
  kpis: { total: 1, porEstado: { Terminado: 0, Atrasado: 0, 'En riesgo': 0, 'En plazo': 1 } },
  flujo: [{ etapa: 'Corte', cantidad: 1 }],
};

describe('esquemas zod del tablero (2.3-2.4)', () => {
  it('acepta un envelope válido con los cuatro literales de semáforo en porEstado', () => {
    expect(EsquemaRespuestaListadoTablero.parse(envelopeValido)).toEqual(envelopeValido);
  });

  it('rechaza un estado desconocido en semáforo', () => {
    const invalido = { ...tarjetaValida, semaforo: 'Morado' };
    expect(() => EsquemaTarjetaOrden.parse(invalido)).toThrow();
  });

  it('rechaza porEstado incompleto', () => {
    const invalido = { ...envelopeValido, kpis: { total: 1, porEstado: { Terminado: 1, Atrasado: 0 } } };
    expect(() => EsquemaRespuestaListadoTablero.parse(invalido)).toThrow();
  });

  it('rechaza cuerpo inválido sin ops', () => {
    expect(() => EsquemaRespuestaListadoTablero.parse({ kpis: envelopeValido.kpis, flujo: [] })).toThrow();
  });
});
