import type { DetalleOpDTO, EtapaDetalleDTO, MaterialDetalleDTO } from '../../src/shared/domain-client/tipos.ts';

export function crearEtapaDetalle(parcial: Partial<EtapaDetalleDTO> = {}): EtapaDetalleDTO {
  return { id: 'e-1', nombre: 'Corte', ordenSecuencia: 1, completada: false, horasVendidas: '7.50', ...parcial };
}

export function crearMaterialDetalle(parcial: Partial<MaterialDetalleDTO> = {}): MaterialDetalleDTO {
  return {
    id: 'm-1',
    ordenId: 'op-1',
    tipo: 'MP',
    descripcion: 'Acero',
    cantidad: '2.00',
    unidad: 'kg',
    costoUnitarioCotizado: '10.50',
    costoUnitarioReal: null,
    nroRemito: null,
    nroFactura: null,
    nt: null,
    po: null,
    ...parcial,
  };
}

export function crearDetalle(parcial: Partial<DetalleOpDTO> = {}): DetalleOpDTO {
  return {
    id: 'op-1',
    numeroOp: '1871',
    codigoPlano: 'PL-2026-045',
    clienteId: 'c-1',
    clienteNombre: 'ACME',
    descripcionPieza: 'Eje',
    etapas: [crearEtapaDetalle()],
    avance: 0,
    semaforo: 'En plazo',
    diasRestantes: 2,
    etapaAhora: 'Corte',
    etiquetaPlazo: 'Faltan 2 días',
    horasVendidasTotales: '40.00',
    horasRealesTotales: '0.00',
    fechaIngreso: '2026-11-22',
    fechaEntrega: '2026-12-01',
    montoVendido: '1000.00',
    observaciones: null,
    horas: [],
    desvioHoras: '40.00',
    porcentajeConsumo: '0.00',
    alertaDesvio: false,
    materiales: [crearMaterialDetalle()],
    costoMaterialesCotizado: '21.00',
    costoMaterialesReal: '0.00',
    comparativaPorEtapa: [],
    margenReal: '979.00',
    tasaGlobalNoConfigurada: false,
    ...parcial,
  };
}
