export type { Decimal } from './decimal/operaciones.ts';
export { comparar, desdeCadena, multiplicar, restar, sumar } from './decimal/operaciones.ts';
export type {
  MaterialModeloPlanilla,
  MaterialOperativoModeloPlanilla,
  EntradaModeloPlanilla,
  ModeloPlanilla,
} from './exportacion/index.ts';
export { construirModeloPlanilla } from './exportacion/index.ts';
export type { EstadoSalud, RespuestaSalud } from './salud/contrato.ts';
export { RUTA_SALUD } from './salud/contrato.ts';
export type { Configuracion } from './configuracion/contrato.ts';
export type {
  ConfiguracionValidada,
  ErrorValidacionConfiguracion,
  ResultadoValidacionConfiguracion,
  ResultadoValidacionEtapas,
} from './configuracion/validar.ts';
export { validarConfiguracion, validarEtapasDefault } from './configuracion/validar.ts';
export type { Cliente, NuevoCliente } from './clientes/contrato.ts';
export type { NuevaOrdenTrabajo, OrdenTrabajo } from './ordenes/contrato.ts';
export type { EtapaOrden, NuevaEtapa } from './etapas/contrato.ts';
export type {
  ContextoTarjeta,
  EtapaTarjeta,
  TarjetaOrdenDTO,
} from './ordenes/tarjeta.ts';
export { construirTarjetaOrden } from './ordenes/tarjeta.ts';
export type {
  EtapaDetalleDTO,
  MaterialDetalleDTO,
  ParteHoraDTO,
  DetalleOpDTO,
  EntradaDetalleOp,
} from './ordenes/detalle.ts';
export { construirDetalleOp } from './ordenes/detalle.ts';
export { normalizarCodigoPlano } from './ordenes/codigo-plano.ts';
export type { CodigoPlano } from './ordenes/codigo-plano.ts';
export { calcularAvance } from './ordenes/avance.ts';
export { etapaAhora } from './ordenes/etapa-ahora.ts';
export { agruparFlujo } from './ordenes/flujo.ts';
export type { GrupoFlujo, OrdenConEtapas } from './ordenes/flujo.ts';
export { nombreEtapaDuplicado } from './etapas/nombres.ts';
export { calcularHorasVendidasTotales } from './etapas/horas-vendidas.ts';
export { calcularSemaforo } from './costos/semaforo.ts';
export { diasRestantes, etiquetaPlazo } from './costos/plazo.ts';
export type { ContextoPlazo, EstadoSemaforo } from './costos/contrato.ts';
export type { ItemMaterialMargen, EntradaMargenReal } from './margen/index.ts';
export { costoMaterialReal, costoMaterialesCotizado, margenReal, tasaGlobalNoConfigurada } from './margen/index.ts';
export type { MaterialOrden, NuevoMaterialOrden, TipoMaterial } from './materiales/contrato.ts';
export { TIPOS_MATERIAL } from './materiales/contrato.ts';
export { validarNuevoMaterial } from './materiales/validar.ts';
export { calcularAgregadosMateriales } from './materiales/agregados.ts';
export type { AgregadosMateriales, MaterialParaAgregado } from './materiales/agregados.ts';
export type {
  EtapaParaComparativa,
  ParteParaComparativa,
  EntradaComparativaPorEtapa,
  FilaComparativaPorEtapa,
  RegistroHora,
  NuevoRegistroHora,
  ResultadoValidacion,
  EntradaAlertaDesvio,
} from './horas/index.ts';
export { comparativaPorEtapa } from './horas/index.ts';
export { UMBRAL_DESVIO_PORCENTAJE } from './horas/umbral.ts';
export {
  validarRegistroHora,
  calcularHorasRealesTotales,
  calcularDesvioHoras,
  calcularConsumoHoras,
  evaluarAlertaDesvio,
} from './horas/index.ts';
