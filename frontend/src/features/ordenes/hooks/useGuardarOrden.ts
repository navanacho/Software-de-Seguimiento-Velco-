import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { actualizarOp, crearOp } from '../../../shared/domain-client/escribirOps.ts';
import { aActualizarOp, aCrearOp } from '../aPayload.ts';
import { mapearErrorGuardado } from '../erroresFormulario.ts';
import type { ErroresFormulario, ValoresFormulario } from '../tiposFormulario.ts';

interface Params {
  readonly ordenId: string | undefined;
  readonly onError: (errores: ErroresFormulario) => void;
}

export function useGuardarOrden({ ordenId, onError }: Params) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (valores: ValoresFormulario) => {
      if (ordenId !== undefined) {
        await actualizarOp(ordenId, aActualizarOp(valores));
        return;
      }
      await crearOp(aCrearOp(valores));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tablero'] });
      navigate('/');
    },
    onError: (error) => onError(mapearErrorGuardado(error)),
  });
}
