import { useMutation, useQueryClient } from '@tanstack/react-query';
import { actualizarEtapaRemota, type ComandoActualizarEtapa } from '../../../shared/domain-client/actualizarEtapaRemota.ts';
import type { RespuestaListadoTablero } from '../../../shared/domain-client/tipos.ts';

type Contexto = { previas: [readonly unknown[], RespuestaListadoTablero | undefined][] };

export function useActualizarEtapa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (comando: ComandoActualizarEtapa) => actualizarEtapaRemota(comando),
    onMutate: async (comando) => {
      await queryClient.cancelQueries({ queryKey: ['tablero'] });
      const previas = queryClient.getQueriesData<RespuestaListadoTablero>({ queryKey: ['tablero'] });
      queryClient.setQueriesData<RespuestaListadoTablero>({ queryKey: ['tablero'] }, (anterior) => {
        if (!anterior) return anterior;
        return {
          ...anterior,
          ops: anterior.ops.map((op) => op.id !== comando.ordenId ? op : {
            ...op,
            etapas: op.etapas.map((e) => e.id === comando.etapaId ? { ...e, completada: comando.completada } : e),
          }),
        };
      });
      return { previas } satisfies Contexto;
    },
    onError: (_err, _cmd, contexto) => {
      for (const [key, data] of contexto?.previas ?? []) {
        queryClient.setQueryData(key, data);
      }
    },
    onSuccess: (tarjeta) => {
      queryClient.setQueriesData<RespuestaListadoTablero>({ queryKey: ['tablero'] }, (anterior) => {
        if (!anterior) return anterior;
        return { ...anterior, ops: anterior.ops.map((op) => (op.id === tarjeta.id ? tarjeta : op)) };
      });
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tablero'] });
    },
  });
}
