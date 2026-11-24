import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cargarHora,
  editarHora,
  eliminarHora,
  listarHoras,
} from '../../../shared/domain-client/horas.ts';
import type { CargarHoraEntrada, EditarHoraEntrada } from '../../../shared/domain-client/esquemas.ts';
import { claveHoras, claveOrden } from '../queries/clavesOrdenes.ts';

export function useHoras(ordenId: string | undefined) {
  return useQuery({
    queryKey: claveHoras(ordenId ?? 'nueva'),
    queryFn: () => listarHoras(ordenId ?? ''),
    enabled: typeof ordenId === 'string' && ordenId.trim() !== '',
  });
}

function useInvalidarHoras(ordenId: string) {
  const queryClient = useQueryClient();
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: claveOrden(ordenId) }),
      queryClient.invalidateQueries({ queryKey: ['tablero'] }),
      queryClient.invalidateQueries({ queryKey: claveHoras(ordenId) }),
    ]);
  };
}

export function useCargarHora(ordenId: string) {
  const invalidar = useInvalidarHoras(ordenId);
  return useMutation({
    mutationFn: (cuerpo: CargarHoraEntrada) => cargarHora(ordenId, cuerpo),
    onSettled: invalidar,
  });
}

export function useEditarHora(ordenId: string) {
  const invalidar = useInvalidarHoras(ordenId);
  return useMutation({
    mutationFn: (comando: { parteId: string; cambios: EditarHoraEntrada }) =>
      editarHora(ordenId, comando.parteId, comando.cambios),
    onSettled: invalidar,
  });
}

export function useEliminarHora(ordenId: string) {
  const invalidar = useInvalidarHoras(ordenId);
  return useMutation({
    mutationFn: (parteId: string) => eliminarHora(ordenId, parteId),
    onSettled: invalidar,
  });
}
