import { describe, expect, it } from 'vitest';
import {
  EsquemaCargarHora,
  EsquemaDetalleOp,
  EsquemaEditarHora,
  EsquemaRespuestaListadoTablero,
  EsquemaTarjetaOrden,
} from './esquemas.ts';
import { crearDetalle } from '../../../test/ordenes/fixtures.ts';

const tarjetaValida = {
  id: 'op1', numeroOp: 'OT-1', codigoPlano: null, clienteId: 'c1', clienteNombre: 'Cliente', descripcionPieza: 'Pieza',
  etapas: [{ id: 'e1', nombre: 'Corte', ordenSecuencia: 1, completada: false }],
  avance: 0, semaforo: 'En plazo', diasRestantes: 2, etapaAhora: 'Corte', etiquetaPlazo: 'Faltan 2 días',
  horasVendidasTotales: '40.00', horasRealesTotales: '32.00',
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

  it('C-09 conserva los totales de horas del DTO de tarjeta al validar', () => {
    expect(EsquemaTarjetaOrden.parse(tarjetaValida)).toEqual(tarjetaValida);
  });

  it('rechaza horas negativas con un mensaje de mayores a cero', () => {
    for (const horas of ['-1', '-0.01']) {
      const resultado = EsquemaCargarHora.safeParse({ operario: 'Ana', fecha: '2026-11-24', horas });
      expect(resultado.success, horas).toBe(false);
      if (resultado.success) continue;
      expect(resultado.error.issues[0]?.message).toMatch(/mayores a cero/i);
      expect(resultado.error.issues[0]?.message).not.toMatch(/pattern|regex|invalid string/i);
    }
  });

  it('rechaza horas cero con el mismo mensaje en alta y edición', () => {
    const entrada = { operario: 'Ana', fecha: '2026-11-24', horas: '0' };
    const alta = EsquemaCargarHora.safeParse(entrada);
    const edicion = EsquemaEditarHora.safeParse({ horas: '0' });
    expect(alta.success).toBe(false);
    expect(edicion.success).toBe(false);
    if (!alta.success) expect(alta.error.issues[0]?.message).toMatch(/mayores a cero/i);
    if (!edicion.success) expect(edicion.error.issues[0]?.message).toMatch(/mayores a cero/i);
  });

  it('no confunde horas no numéricas con el mensaje de mayores a cero', () => {
    const resultado = EsquemaCargarHora.safeParse({ operario: 'Ana', fecha: '2026-11-24', horas: 'abc' });
    expect(resultado.success).toBe(false);
    if (resultado.success) return;
    expect(resultado.error.issues[0]?.message).not.toMatch(/mayores a cero/i);
  });

  it('C-09 valida partes y derivados de horas en el detalle sin calcularlos', () => {
    const parte = {
      id: 'h-1', ordenId: 'op1', etapaId: null, operario: 'Ana', fecha: '2026-11-20',
      horas: '2.50', createdAt: '2026-11-20T10:00:00.000Z', observacion: null,
    };
    const detalle = crearDetalle({
      horas: [parte],
      horasRealesTotales: '2.50',
      desvioHoras: '37.50',
      porcentajeConsumo: '6.25',
      alertaDesvio: false,
    });
    const validado = EsquemaDetalleOp.parse(detalle);
    expect(validado.horas).toEqual([parte]);
    expect(validado.horasRealesTotales).toBe('2.50');
    expect(validado.desvioHoras).toBe('37.50');
    expect(validado.porcentajeConsumo).toBe('6.25');
    expect(validado.alertaDesvio).toBe(false);
  });
});
