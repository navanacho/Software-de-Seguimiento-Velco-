import type { ContextoTarjeta } from '@velco/domain';
import { fechaCalendarioEnZona } from '../../../shared/reloj.ts';
import type { Reloj } from '../../../shared/reloj.ts';
import type { ConfiguracionRepository } from './ports/ConfiguracionRepository.ts';

export const DIAS_ALERTA_DEFAULT = 3;
export const PORCENTAJE_RIESGO_DEFAULT = 80;
export const ETAPAS_DEFAULT = ['Corte', 'Soldadura', 'Mecanizado', 'Pintura', 'Entrega'] as const;

export interface DependenciasContexto {
  readonly configuracion: ConfiguracionRepository;
  readonly reloj: Reloj;
  readonly zonaHoraria: string;
}

export async function contextoTarjeta(
  dependencias: DependenciasContexto,
  clienteNombre?: string | null,
): Promise<ContextoTarjeta> {
  const configuracion = await dependencias.configuracion.obtener();
  const base: ContextoTarjeta = {
    hoy: fechaCalendarioEnZona(dependencias.reloj.ahora(), dependencias.zonaHoraria),
    zonaHoraria: dependencias.zonaHoraria,
    diasAlertaRiesgo: configuracion?.diasAlertaRiesgo ?? DIAS_ALERTA_DEFAULT,
    porcentajeAvanceRiesgo: configuracion?.porcentajeAvanceRiesgo ?? PORCENTAJE_RIESGO_DEFAULT,
  };
  return clienteNombre !== null && clienteNombre !== undefined
    ? { ...base, clienteNombre }
    : base;
}
