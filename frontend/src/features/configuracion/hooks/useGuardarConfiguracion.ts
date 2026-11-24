import { useMutation, useQueryClient } from '@tanstack/react-query';
import { guardarConfiguracion } from '../../../shared/domain-client/escribirConfiguracion.ts';
import type { BodyConfiguracion, ConfiguracionDTO } from '../../../shared/domain-client/configuracion.ts';
import { ErrorApi } from '../../../shared/domain-client/errores.ts';
import { claveConfiguracion } from '../queries/clavesConfiguracion.ts';

export function useGuardarConfiguracion() {
  const queryClient = useQueryClient();
  return useMutation<ConfiguracionDTO, ErrorApi, BodyConfiguracion>({
    mutationFn: (cuerpo) => guardarConfiguracion(cuerpo),
    onSuccess: (configuracion) => {
      queryClient.setQueryData(claveConfiguracion, configuracion);
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: claveConfiguracion }),
        queryClient.invalidateQueries({ queryKey: ['tablero'] }),
        queryClient.invalidateQueries({ queryKey: ['orden'] }),
      ]);
    },
  });
}
