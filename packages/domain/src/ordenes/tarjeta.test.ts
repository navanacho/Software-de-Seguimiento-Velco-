import { describe, expect, it } from 'vitest';
import type { TarjetaOrdenDTO } from '@velco/domain';
import { CONTEXTO, crearEtapas, crearOrden } from '../testing/fixtures.ts';
import { construirTarjetaOrden } from './tarjeta.ts';

const contexto = { ...CONTEXTO, clienteNombre: 'Bodega Los Andes' };

describe('construirTarjetaOrden', () => {
  it('RN-GLOBAL-02: aplana avance, semaforo, dias restantes, etapa ahora y etiqueta', () => {
    const orden = crearOrden({ fechaEntrega: '2026-03-11' });
    const dto = construirTarjetaOrden(orden, crearEtapas(['Corte', 'Soldadura'], 1), contexto);
    expect(dto.avance).toBe(50);
    expect(dto.semaforo).toBe('En riesgo');
    expect(dto.diasRestantes).toBe(3);
    expect(dto.etapaAhora).toBe('Soldadura');
    expect(dto.etiquetaPlazo).toBe('Faltan 3 días');
  });

  it('HU-05: la tarjeta trae número de OP, cliente, pieza y etapas sin horas ni costos', () => {
    const dto = construirTarjetaOrden(
      crearOrden({ fechaEntrega: '2026-03-12' }),
      crearEtapas(['Corte', 'Soldadura'], 1),
      contexto,
    );
    expect(dto.numeroOp).toBe('OT-1041');
    expect(dto.clienteNombre).toBe('Bodega Los Andes');
    expect(dto.descripcionPieza).toBe('Eje de transmision');
    expect(dto.etapas).toEqual([
      { id: 'etapa-1', nombre: 'Corte', ordenSecuencia: 1, completada: true },
      { id: 'etapa-2', nombre: 'Soldadura', ordenSecuencia: 2, completada: false },
    ]);
    expect(dto).not.toHaveProperty('montoVendido');
    expect(dto.etapas[0]).not.toHaveProperty('horasVendidas');
  });

  it('R3: construir la tarjeta es determinista y no muta sus entradas', () => {
    const orden = Object.freeze(crearOrden({ fechaEntrega: '2026-03-12' }));
    const etapas = Object.freeze(crearEtapas(['Corte', 'Soldadura'], 1));
    const contextoCongelado = Object.freeze({ ...contexto });
    const primero = construirTarjetaOrden(orden, etapas, contextoCongelado);
    const segundo = construirTarjetaOrden(orden, etapas, contextoCongelado);
    expect(primero.avance).toBe(50);
    expect(primero).toEqual(segundo);
    expect(etapas).toHaveLength(2);
    expect(orden.fechaEntrega).toBe('2026-03-12');
  });

  it('RN-GLOBAL-02: el tipo del DTO se consume desde @velco/domain sin duplicarlo', () => {
    const semaforoDe = (tarjeta: TarjetaOrdenDTO): string => tarjeta.semaforo;
    const dto = construirTarjetaOrden(
      crearOrden({ fechaEntrega: '2026-03-12' }),
      crearEtapas(['Corte', 'Soldadura'], 1),
      contexto,
    );
    expect(semaforoDe(dto)).toBe('En plazo');
  });
});
