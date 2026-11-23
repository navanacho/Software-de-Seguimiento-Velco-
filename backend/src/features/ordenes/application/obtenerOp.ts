import {
  calcularAgregadosMateriales,
  calcularConsumoHoras,
  calcularDesvioHoras,
  calcularHorasRealesTotales,
  calcularHorasVendidasTotales,
  construirTarjetaOrden,
  evaluarAlertaDesvio,
} from '@velco/domain';
import type { DependenciasApi } from '../../../shared/dependencias.ts';
import { contextoTarjeta } from '../../configuracion/application/contextoTarjeta.ts';
import type { DetalleOpDTO, EtapaDetalleDTO } from './DetalleOpDTO.ts';

export async function obtenerOp(
  dependencias: DependenciasApi,
  id: string,
): Promise<DetalleOpDTO | null> {
  const orden = await dependencias.ops.buscarPorId(id);
  if (orden === null) return null;
  const etapas = await dependencias.etapas.listarPorOrden(id);
  const cliente = await dependencias.clientes.buscarPorId(orden.clienteId);
  const contexto = await contextoTarjeta(
    {
      configuracion: dependencias.configuracion,
      reloj: dependencias.reloj,
      zonaHoraria: dependencias.zonaHoraria,
    },
    cliente?.nombre ?? null,
  );
  const tarjeta = construirTarjetaOrden(orden, etapas, contexto);
  const horasPorId = new Map(etapas.map((etapa) => [etapa.id, etapa.horasVendidas]));
  const etapasDetalle: EtapaDetalleDTO[] = tarjeta.etapas.map((etapa) => {
    const horasVendidas = horasPorId.get(etapa.id);
    if (horasVendidas === undefined) {
      throw new Error(`la etapa ${etapa.id} no tiene horasVendidas mapeadas`);
    }
    return { ...etapa, horasVendidas };
  });
  const materiales = await dependencias.materiales.listarPorOrden(id);
  const agregados = calcularAgregadosMateriales(materiales);
  const horas = await dependencias.horas.listarPorOrden(id);
  const horasReales = horas.map((h) => h.horas);
  const horasVendidas = etapas.map((e) => e.horasVendidas);
  const horasRealesTotales = calcularHorasRealesTotales(horasReales);
  const horasVendidasTotales = calcularHorasVendidasTotales(horasVendidas);
  const desvioHoras = calcularDesvioHoras(horasVendidas, horasReales);
  const porcentajeConsumo = calcularConsumoHoras(horasRealesTotales, horasVendidasTotales);
  const alertaDesvio = evaluarAlertaDesvio({
    consumo: porcentajeConsumo,
    avance: tarjeta.avance,
    horasReales: horasRealesTotales,
    horasVendidas: horasVendidasTotales,
  });

  return {
    ...tarjeta,
    etapas: etapasDetalle,
    fechaIngreso: orden.fechaIngreso,
    fechaEntrega: orden.fechaEntrega,
    montoVendido: orden.montoVendido,
    observaciones: orden.observaciones,
    horas,
    horasRealesTotales,
    desvioHoras,
    porcentajeConsumo,
    alertaDesvio,
    materiales,
    costoMaterialesCotizado: agregados.costoMaterialesCotizado,
    costoMaterialesReal: agregados.costoMaterialesReal,
  };
}
