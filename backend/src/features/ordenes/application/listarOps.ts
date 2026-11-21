import {
  agruparFlujo,
  construirTarjetaOrden,
  type EstadoSemaforo,
  type GrupoFlujo,
  type TarjetaOrdenDTO,
} from '@velco/domain';
import type { DependenciasApi } from '../../../shared/dependencias.ts';
import { contextoTarjeta } from '../../configuracion/application/contextoTarjeta.ts';

const ESTADOS: readonly EstadoSemaforo[] = ['Terminado', 'Atrasado', 'En riesgo', 'En plazo'];

export interface FiltrosListadoOps {
  readonly fechaDesde?: string | undefined;
  readonly fechaHasta?: string | undefined;
  readonly estado?: EstadoSemaforo | undefined;
  readonly clienteId?: string | undefined;
  readonly etapaAhora?: string | undefined;
  readonly buscar?: string | undefined;
}

export interface KpisListadoOps {
  readonly total: number;
  readonly porEstado: Record<EstadoSemaforo, number>;
}

export interface RespuestaListadoOps {
  readonly ops: readonly TarjetaOrdenDTO[];
  readonly kpis: KpisListadoOps;
  readonly flujo: readonly GrupoFlujo[];
}

interface FilaDerivada {
  readonly fechaEntrega: string;
  readonly numeroOp: string;
  readonly descripcionPieza: string;
  readonly tarjeta: TarjetaOrdenDTO;
}

function cumpleFiltros(fila: FilaDerivada, filtros: FiltrosListadoOps): boolean {
  if (filtros.fechaDesde !== undefined && fila.fechaEntrega < filtros.fechaDesde) return false;
  if (filtros.fechaHasta !== undefined && fila.fechaEntrega > filtros.fechaHasta) return false;
  if (filtros.estado !== undefined && fila.tarjeta.semaforo !== filtros.estado) return false;
  if (filtros.etapaAhora !== undefined && fila.tarjeta.etapaAhora !== filtros.etapaAhora) {
    return false;
  }
  if (filtros.clienteId !== undefined && fila.tarjeta.clienteId !== filtros.clienteId) {
    return false;
  }
  if (filtros.buscar !== undefined) {
    const texto = `${fila.numeroOp} ${fila.descripcionPieza}`.toLowerCase();
    if (!texto.includes(filtros.buscar.toLowerCase())) return false;
  }
  return true;
}

function compararFilas(a: FilaDerivada, b: FilaDerivada): number {
  return a.fechaEntrega.localeCompare(b.fechaEntrega) || a.numeroOp.localeCompare(b.numeroOp);
}

export async function listarOps(
  dependencias: DependenciasApi,
  filtros: FiltrosListadoOps,
): Promise<RespuestaListadoOps> {
  const filas = await dependencias.ops.listarConEtapas();
  const derivadas = await Promise.all(
    filas.map(async (fila) => {
      const contexto = await contextoTarjeta(
        {
          configuracion: dependencias.configuracion,
          reloj: dependencias.reloj,
          zonaHoraria: dependencias.zonaHoraria,
        },
        fila.clienteNombre,
      );
      return {
        fechaEntrega: fila.orden.fechaEntrega,
        numeroOp: fila.orden.numeroOp,
        descripcionPieza: fila.orden.descripcionPieza,
        tarjeta: construirTarjetaOrden(fila.orden, fila.etapas, contexto),
      };
    }),
  );

  const flujo = agruparFlujo(filas);
  const filtradas = derivadas
    .filter((fila) => cumpleFiltros(fila, filtros))
    .slice()
    .sort(compararFilas);
  const porEstado = Object.fromEntries(ESTADOS.map((estado) => [estado, 0])) as Record<
    EstadoSemaforo,
    number
  >;
  for (const fila of filtradas) {
    porEstado[fila.tarjeta.semaforo] += 1;
  }

  return {
    ops: filtradas.map((fila) => fila.tarjeta),
    kpis: { total: filtradas.length, porEstado },
    flujo,
  };
}
