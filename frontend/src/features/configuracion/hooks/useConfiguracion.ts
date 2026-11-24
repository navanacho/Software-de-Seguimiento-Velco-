import { useQuery } from '@tanstack/react-query';
import { consultarConfiguracion } from '../../../shared/domain-client/escribirConfiguracion.ts';
import { claveConfiguracion } from '../queries/clavesConfiguracion.ts';

export function useConfiguracion() {
  return useQuery({
    queryKey: claveConfiguracion,
    queryFn: () => consultarConfiguracion(),
  });
}
