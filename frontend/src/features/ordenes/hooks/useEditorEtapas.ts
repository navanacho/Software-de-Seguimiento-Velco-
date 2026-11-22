import { useQueryClient } from '@tanstack/react-query';
import { consultarOp } from '../../../shared/domain-client/consultarOp.ts';
import { altaEtapa, bajaEtapa, reordenarEtapa } from '../../../shared/domain-client/escribirOps.ts';
import type { DetalleOpDTO } from '../../../shared/domain-client/tipos.ts';
import { claveOrden } from '../queries/clavesOrdenes.ts';
import type { EtapaFormulario } from '../tiposFormulario.ts';

function aEtapasFormulario(detalle: DetalleOpDTO): readonly EtapaFormulario[] {
  return detalle.etapas.map((etapa) => ({
    id: etapa.id,
    nombre: etapa.nombre,
    horasVendidas: etapa.horasVendidas,
  }));
}

export function useEditorEtapas(ordenId: string) {
  const queryClient = useQueryClient();

  async function recargar(): Promise<readonly EtapaFormulario[]> {
    const clave = claveOrden(ordenId);
    await queryClient.invalidateQueries({ queryKey: clave });
    const detalle = await queryClient.fetchQuery({
      queryKey: clave,
      queryFn: () => consultarOp(ordenId),
    });
    return aEtapasFormulario(detalle);
  }

  return {
    alta: (nombre: string, horasVendidas: string) =>
      altaEtapa(ordenId, { nombre, horasVendidas }).then(recargar),
    baja: (etapaId: string) => bajaEtapa(ordenId, etapaId).then(recargar),
    reordenar: (etapaId: string, ordenSecuencia: number) =>
      reordenarEtapa(ordenId, etapaId, ordenSecuencia).then(recargar),
  };
}
