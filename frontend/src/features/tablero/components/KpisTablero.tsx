import type { KpisTablero as Kpis } from '../../../shared/domain-client/tipos.ts';

interface Props { kpis: Kpis }

export function KpisTablero({ kpis }: Props) {
  return (
    <section data-testid="kpis-tablero">
      <div data-testid="kpi-total">Total: {kpis.total}</div>
      <div data-testid="kpi-Terminado">Terminado: {kpis.porEstado.Terminado}</div>
      <div data-testid="kpi-Atrasado">Atrasado: {kpis.porEstado.Atrasado}</div>
      <div data-testid="kpi-En riesgo">En riesgo: {kpis.porEstado['En riesgo']}</div>
      <div data-testid="kpi-En plazo">En plazo: {kpis.porEstado['En plazo']}</div>
    </section>
  );
}
