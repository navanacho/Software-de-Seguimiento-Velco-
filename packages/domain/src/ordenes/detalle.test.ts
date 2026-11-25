import { describe, expect, it } from 'vitest';
import type { EtapaOrden } from '../etapas/contrato.ts';
import type { MaterialOrden } from '../materiales/contrato.ts';
import type { RegistroHora } from '../horas/reglas.ts';
import { CONTEXTO, crearEtapa, crearOrden } from '../testing/fixtures.ts';
import { construirTarjetaOrden } from './tarjeta.ts';
import { construirDetalleOp } from './detalle.ts';

function material(cambios: Partial<MaterialOrden> = {}): MaterialOrden {
  return {
    id: 'm-1',
    ordenId: 'op-1',
    tipo: 'MP',
    descripcion: 'Acero',
    cantidad: '2.0000',
    unidad: 'kg',
    costoUnitarioCotizado: '4.25',
    costoUnitarioReal: null,
    nroRemito: null,
    nroFactura: null,
    nt: null,
    po: null,
    ...cambios,
  };
}

function parte(cambios: Partial<RegistroHora> = {}): RegistroHora {
  return {
    id: 'h-1',
    ordenId: 'op-1',
    etapaId: 'etapa-1',
    operario: 'Ana',
    fecha: '2026-03-02',
    horas: '36.00',
    createdAt: '2026-03-02T10:00:00.000Z',
    observacion: null,
    ...cambios,
  };
}

describe('C-11 DTO canónico del detalle', () => {
  it('HU-14/15/16 amplía el detalle con comparativa, agregados y margen sin cálculo externo', () => {
    const orden = crearOrden({ montoVendido: '1000.00' });
    const etapas: readonly EtapaOrden[] = [
      crearEtapa({ id: 'etapa-1', horasVendidas: '40.00' }),
      crearEtapa({ id: 'etapa-2', nombre: 'Soldadura', ordenSecuencia: 2, horasVendidas: '20.00' }),
    ];
    const horas: readonly RegistroHora[] = [
      parte(),
      parte({ id: 'h-2', etapaId: 'etapa-2', horas: '22.00' }),
    ];
    const materiales: readonly MaterialOrden[] = [
      material({ cantidad: '2.0000', costoUnitarioCotizado: '9.00', costoUnitarioReal: '10.50' }),
      material({ id: 'm-2', cantidad: '3.0000', costoUnitarioCotizado: '4.25', costoUnitarioReal: null }),
    ];
    const tarjeta = construirTarjetaOrden(
      orden,
      etapas,
      { ...CONTEXTO, clienteNombre: 'ACME', valorHoraEstandar: '12.50' },
      horas.map((hora) => hora.horas),
    );
    const detalle = construirDetalleOp({
      tarjeta,
      orden,
      etapas,
      horas,
      materiales,
      valorHoraEstandar: '12.50',
    });
    expect(detalle.montoVendido).toBe('1000.00');
    expect(detalle.horasVendidasTotales).toBe('60.00');
    expect(detalle.horasRealesTotales).toBe('58.00');
    expect(detalle.desvioHoras).toBe('2.00');
    expect(detalle.porcentajeConsumo).toBe('96.66');
    expect(detalle.alertaDesvio).toBe(true);
    expect(detalle.costoMaterialesCotizado).toBe('30.75');
    expect(detalle.costoMaterialesReal).toBe('33.75');
    expect(detalle.margenReal).toBe('241.25');
    expect(detalle.tasaGlobalNoConfigurada).toBe(false);
    expect(detalle.comparativaPorEtapa).toHaveLength(2);
    expect(detalle.comparativaPorEtapa[0]).toMatchObject({
      etapaId: 'etapa-1',
      desvioHoras: '4.00',
      porcentajeConsumo: '90.00',
    });
    expect(detalle.etapas.map((etapa) => etapa.horasVendidas)).toEqual(['40.00', '20.00']);
  });

  it('Flujo 5 con tasa cero calcula margen y transporta consumo null sin excepción', () => {
    const orden = crearOrden({ montoVendido: '500.00' });
    const etapas: readonly EtapaOrden[] = [
      crearEtapa({ horasVendidas: '0.00' }),
    ];
    const tarjeta = construirTarjetaOrden(
      orden,
      etapas,
      { ...CONTEXTO, valorHoraEstandar: '0.00' },
      [],
    );
    const detalle = construirDetalleOp({
      tarjeta,
      orden,
      etapas,
      horas: [],
      materiales: [material({ cantidad: '1.0000' })],
      valorHoraEstandar: '0.00',
    });
    expect(detalle.margenReal).toBe('495.75');
    expect(detalle.tasaGlobalNoConfigurada).toBe(true);
    expect(detalle.porcentajeConsumo).toBeNull();
    expect(detalle.alertaDesvio).toBe(false);
    expect(detalle.comparativaPorEtapa[0]).toMatchObject({ porcentajeConsumo: null });
  });
});
