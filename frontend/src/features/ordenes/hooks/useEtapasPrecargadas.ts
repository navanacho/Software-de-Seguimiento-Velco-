import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { consultarConfiguracion } from '../../../shared/domain-client/escribirConfiguracion.ts';
import { claveConfiguracion } from '../../configuracion/queries/clavesConfiguracion.ts';
import { ETAPAS_PRECARGADAS } from '../precargaEtapas.ts';
import type { EtapaFormulario } from '../tiposFormulario.ts';

export function useEtapasPrecargadas(habilitado: boolean): readonly EtapaFormulario[] {
  const { data } = useQuery({
    queryKey: claveConfiguracion,
    queryFn: () => consultarConfiguracion(),
    enabled: habilitado,
    retry: false,
  });

  return useMemo(
    () => data?.etapasDefault.map((nombre) => ({ nombre, horasVendidas: '0.00' })) ?? ETAPAS_PRECARGADAS,
    [data],
  );
}
