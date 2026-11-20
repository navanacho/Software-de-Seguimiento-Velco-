export type { EstadoSalud, RespuestaSalud } from './salud/contrato.ts';
export { RUTA_SALUD } from './salud/contrato.ts';
export type { Configuracion } from './configuracion/contrato.ts';
export type { Cliente, NuevoCliente } from './clientes/contrato.ts';
export type { NuevaOrdenTrabajo, OrdenTrabajo } from './ordenes/contrato.ts';
export type { EtapaOrden, NuevaEtapa } from './etapas/contrato.ts';
export type {
  ContextoTarjeta,
  EtapaTarjeta,
  TarjetaOrdenDTO,
} from './ordenes/tarjeta.ts';
export { construirTarjetaOrden } from './ordenes/tarjeta.ts';
export { calcularAvance } from './ordenes/avance.ts';
export { etapaAhora } from './ordenes/etapa-ahora.ts';
export { agruparFlujo } from './ordenes/flujo.ts';
export type { GrupoFlujo, OrdenConEtapas } from './ordenes/flujo.ts';
export { calcularSemaforo } from './costos/semaforo.ts';
export { diasRestantes, etiquetaPlazo } from './costos/plazo.ts';
export type { ContextoPlazo, EstadoSemaforo } from './costos/contrato.ts';
