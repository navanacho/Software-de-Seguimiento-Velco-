import {
  calcularAvance,
  calcularHorasRealesTotales,
  calcularHorasVendidasTotales,
  comparativaPorEtapa,
  construirModeloPlanilla,
  type ModeloPlanilla,
} from '@velco/domain';
import type { DependenciasApi } from '../../../shared/dependencias.ts';
import { contextoTarjeta } from '../../configuracion/application/contextoTarjeta.ts';

export interface OpcionesExportOp {
  readonly incluirMargenes: boolean;
}

export async function exportOp(
  dependencias: DependenciasApi,
  opId: string,
  opciones: OpcionesExportOp,
): Promise<ModeloPlanilla | null> {
  const orden = await dependencias.ops.buscarPorId(opId);
  if (orden === null) return null;
  const etapas = await dependencias.etapas.listarPorOrden(opId);
  const horas = await dependencias.horas.listarPorOrden(opId);
  const horasReales = calcularHorasRealesTotales([await dependencias.horas.totalHorasReales(opId)]);
  const materiales = await dependencias.materiales.listarPorOrden(opId);
  const cliente = await dependencias.clientes.buscarPorId(orden.clienteId);
  const contexto = await contextoTarjeta(
    {
      configuracion: dependencias.configuracion,
      reloj: dependencias.reloj,
      zonaHoraria: dependencias.zonaHoraria,
    },
    cliente?.nombre ?? null,
  );

  return construirModeloPlanilla({
    cliente: cliente?.nombre ?? '',
    numeroOp: orden.numeroOp,
    materiales: materiales.map(
      ({
        tipo,
        descripcion,
        cantidad,
        unidad,
        costoUnitarioCotizado,
        costoUnitarioReal,
      }) => ({
        tipo,
        descripcion,
        cantidad,
        unidad,
        costoUnitarioCotizado,
        costoUnitarioReal,
      }),
    ),
    horasVendidas: calcularHorasVendidasTotales(etapas.map((etapa) => etapa.horasVendidas)),
    horasReales,
    valorHora: contexto.valorHoraEstandar ?? '0.00',
    montoVendido: orden.montoVendido,
    comparativa: comparativaPorEtapa({
      etapas: etapas.map(({ id, nombre, horasVendidas }) => ({ id, nombre, horasVendidas })),
      partes: horas.map(({ etapaId, horas: cantidad }) => ({ etapaId, horas: cantidad })),
      avance: calcularAvance(etapas),
    }),
    incluirMargenes: opciones.incluirMargenes,
  });
}
