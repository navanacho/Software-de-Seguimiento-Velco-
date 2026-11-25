export type {
  EtapaParaComparativa,
  ParteParaComparativa,
  EntradaComparativaPorEtapa,
  FilaComparativaPorEtapa,
} from './comparativa.ts';
export { comparativaPorEtapa } from './comparativa.ts';
export type { RegistroHora, NuevoRegistroHora, ResultadoValidacion, EntradaAlertaDesvio } from './reglas.ts';
export {
  validarRegistroHora,
  calcularHorasRealesTotales,
  calcularHorasVendidasTotales,
  calcularDesvioHoras,
  calcularConsumoHoras,
  evaluarAlertaDesvio,
} from './reglas.ts';
