import { useMutation } from '@tanstack/react-query';
import { altaCliente } from '../../../shared/domain-client/escribirOps.ts';
import type { ClienteOpcion } from '../tiposFormulario.ts';

export function useAltaClienteInline() {
  return useMutation({
    mutationFn: async (nombre: string): Promise<ClienteOpcion> => {
      const cliente = await altaCliente(nombre);
      return { id: cliente.id, nombre: cliente.nombre };
    },
  });
}
