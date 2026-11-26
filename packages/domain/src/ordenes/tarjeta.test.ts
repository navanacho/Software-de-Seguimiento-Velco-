import { describe, expect, it } from 'vitest';
import type { TarjetaOrdenDTO } from '@velco/domain';
import { CONTEXTO, crearEtapas, crearOrden } from '../testing/fixtures.ts';
import { construirTarjetaOrden } from './tarjeta.ts';

const contexto = { ...CONTEXTO, clienteNombre: 'Bodega Los Andes' };
const etapasDeDiez = (completadas: number) =>
  crearEtapas(
    [
      'Corte',
      'Soldadura',
      'Pintura',
      'Armado',
      'Control',
      'Empaque',
      'Carga',
      'Descarga',
      'Prueba',
      'Cierre',
    ],
    completadas,
  );

describe('construirTarjetaOrden', () => {
  it('RN-OP-05: copia codigoPlano como dato persistido sin derivarlo', () => {
    const dto = construirTarjetaOrden(
      crearOrden({ codigoPlano: 'PL-2026-045', fechaEntrega: '2026-03-12' }),
      crearEtapas(['Corte'], 0),
      contexto,
    );
    expect(dto.codigoPlano).toBe('PL-2026-045');
  });

  it('RN-OP-05 TRIANGULA: sin plano queda null y no se inventa texto', () => {
    const dto = construirTarjetaOrden(crearOrden({ codigoPlano: null }), crearEtapas(['Corte'], 0), contexto);
    expect(dto.codigoPlano).toBeNull();
    expect(dto).not.toHaveProperty('planoVisible');
  });

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

  it('C-09 OQ-1=A: la tarjeta incluye totales de horas vendidas y reales calculados en dominio', () => {
    const etapas = crearEtapas(['Corte', 'Soldadura'], 1);
    const dto = construirTarjetaOrden(crearOrden(), etapas, contexto, ['2.50', '1.25']);
    expect(dto.horasVendidasTotales).toBe('8.00');
    expect(dto.horasRealesTotales).toBe('3.75');
  });

  it('C-09 OQ-1=A TRIANGULA: sin partes, horas reales es 0.00 y vendidas surge de etapas', () => {
    const dto = construirTarjetaOrden(crearOrden(), crearEtapas(['Corte'], 0), contexto, []);
    expect(dto.horasVendidasTotales).toBe('4.00');
    expect(dto.horasRealesTotales).toBe('0.00');
  });

  it('C-12 1.1 RED: el DTO expone consumo 80.00 y alerta cuando supera avance + 15', () => {
    const dto = construirTarjetaOrden(crearOrden(), etapasDeDiez(5), contexto, ['32.00']);
    expect(dto.avance).toBe(50);
    expect(dto.horasVendidasTotales).toBe('40.00');
    expect(dto.horasRealesTotales).toBe('32.00');
    expect(dto.porcentajeConsumo).toBe('80.00');
    expect(dto.alertaDesvio).toBe(true);
  });

  it('C-12 1.1 RED TRIANGULA: sin vendidas, consumo nulo y alerta por reales positivas', () => {
    const dto = construirTarjetaOrden(crearOrden(), crearEtapas([], 0), contexto, ['1.25']);
    expect(dto.horasVendidasTotales).toBe('0.00');
    expect(dto.horasRealesTotales).toBe('1.25');
    expect(dto.porcentajeConsumo).toBeNull();
    expect(dto.alertaDesvio).toBe(true);
  });

  it('C-12 1.3 TRIANGULA: consumo 95.00 con avance 80 no activa la alerta', () => {
    const dto = construirTarjetaOrden(crearOrden(), etapasDeDiez(8), contexto, ['38.00']);
    expect(dto.avance).toBe(80);
    expect(dto.porcentajeConsumo).toBe('95.00');
    expect(dto.alertaDesvio).toBe(false);
  });

  it('C-12 1.3 TRIANGULA: consumo 96.00 con avance 80 activa la alerta', () => {
    const dto = construirTarjetaOrden(crearOrden(), etapasDeDiez(8), contexto, ['38.40']);
    expect(dto.avance).toBe(80);
    expect(dto.porcentajeConsumo).toBe('96.00');
    expect(dto.alertaDesvio).toBe(true);
  });
});
