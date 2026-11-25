import { construirDetalleOp, construirTarjetaOrden } from '@velco/domain';
import type { DependenciasApi } from '../../../shared/dependencias.ts';
import { contextoTarjeta } from '../../configuracion/application/contextoTarjeta.ts';
import type { DetalleOpDTO } from './DetalleOpDTO.ts';

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
  const materiales = await dependencias.materiales.listarPorOrden(id);
  return construirDetalleOp({
    tarjeta,
    orden,
    etapas,
    horas,
    materiales,
    valorHoraEstandar: contexto.valorHoraEstandar ?? '0.00',
  });
}
