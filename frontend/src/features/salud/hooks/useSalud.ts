import { useQuery } from '@tanstack/react-query';
import { CLAVE_SALUD, consultarSalud } from '../queries/consultasSalud.ts';

export function useSalud() {
  return useQuery({
    queryKey: CLAVE_SALUD,
    queryFn: () => consultarSalud(),
  });
}
