import { useQuery } from '@tanstack/react-query';
import { consultarOp } from '../../../shared/domain-client/consultarOp.ts';
import { claveOrden } from '../queries/clavesOrdenes.ts';

export function useOrden(ordenId: string | undefined) {
  return useQuery({
    queryKey: claveOrden(ordenId ?? 'nueva'),
    queryFn: () => consultarOp(ordenId ?? ''),
    enabled: typeof ordenId === 'string' && ordenId.trim() !== '',
  });
}
