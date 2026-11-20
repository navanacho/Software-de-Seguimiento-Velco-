export interface Configuracion {
  readonly id: number;
  readonly valorHoraEstandar: string;
  readonly diasAlertaRiesgo: number;
  readonly porcentajeAvanceRiesgo: number;
  readonly etapasDefault: readonly string[];
}
