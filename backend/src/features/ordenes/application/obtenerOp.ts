import {
  calcularAgregadosMateriales,
  calcularConsumoHoras,
  calcularDesvioHoras,
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
  const horas = await dependencias.horas.listarPorOrden(id);
  const tarjeta = construirTarjetaOrden(
    orden,
    etapas,
    contexto,
    horas.map((hora) => hora.horas),
  );
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
  const desvioHoras = calcularDesvioHoras(
    [tarjeta.horasVendidasTotales],
    [tarjeta.horasRealesTotales],
  );
  const porcentajeConsumo = calcularConsumoHoras(
    tarjeta.horasRealesTotales,
    tarjeta.horasVendidasTotales,
  );
  const alertaDesvio = evaluarAlertaDesvio({
    consumo: porcentajeConsumo,
    avance: tarjeta.avance,
    horasReales: tarjeta.horasRealesTotales,
    horasVendidas: tarjeta.horasVendidasTotales,
  });

  return {
    ...tarjeta,
    etapas: etapasDetalle,
    fechaIngreso: orden.fechaIngreso,
    fechaEntrega: orden.fechaEntrega,
    montoVendido: orden.montoVendido,
    observaciones: orden.observaciones,
    horas,
    desvioHoras,
    porcentajeConsumo,
    alertaDesvio,
    materiales,
    costoMaterialesCotizado: agregados.costoMaterialesCotizado,
    costoMaterialesReal: agregados.costoMaterialesReal,
  };
}
