export type EstadoSemaforo = 'Terminado' | 'Atrasado' | 'En riesgo' | 'En plazo';

export interface ContextoPlazo {
  readonly hoy: string;
  readonly zonaHoraria: string;
  readonly diasAlertaRiesgo: number;
  readonly porcentajeAvanceRiesgo: number;
}
