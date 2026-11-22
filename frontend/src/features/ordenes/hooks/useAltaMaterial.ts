import { useMutation } from '@tanstack/react-query';
import { altaMaterial } from '../../../shared/domain-client/escribirOps.ts';
import type { AltaMaterialEntrada } from '../../../shared/domain-client/esquemas.ts';
import type { MaterialDetalleDTO } from '../../../shared/domain-client/tipos.ts';

export function useAltaMaterial(ordenId: string) {
  return useMutation({
    mutationFn: (cuerpo: AltaMaterialEntrada): Promise<MaterialDetalleDTO> => altaMaterial(ordenId, cuerpo),
  });
}
