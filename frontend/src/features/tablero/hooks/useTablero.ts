import { useQuery } from '@tanstack/react-query';
import { consultarTablero, type FiltrosTablero } from '../../../shared/domain-client/consultarTablero.ts';
import { clavesTablero } from '../queries/clavesTablero.ts';

export function useTablero(filtros: FiltrosTablero) {
  return useQuery({
    queryKey: clavesTablero(filtros),
    queryFn: () => consultarTablero(filtros),
  });
}
