import type { DetalleOpDTO } from '../../../shared/domain-client/tipos.ts';
import { formatearPorcentaje } from '../../../shared/domain-client/formatoDecimal.ts';
import estilos from './TablaComparativaEtapas.module.css';

interface Props {
  readonly filas: DetalleOpDTO['comparativaPorEtapa'];
}

export function TablaComparativaEtapas({ filas }: Props) {
  return (
    <table className={estilos.tabla}>
      <caption>Comparativa de horas por etapa</caption>
      <thead>
        <tr>
          <th scope="col">Etapa</th>
          <th scope="col">Horas vendidas</th>
          <th scope="col">Horas reales</th>
          <th scope="col">Desvío en horas</th>
          <th scope="col">Consumo</th>
          <th scope="col">Alerta</th>
        </tr>
      </thead>
      <tbody>
        {filas.map((fila, indice) => (
          <tr
            key={`${fila.etapaId ?? 'sin-etapa'}-${indice}`}
            className={fila.etapaId === null ? estilos.sinEtapa : undefined}
            data-testid={fila.etapaId === null ? 'fila-sin-etapa' : undefined}
          >
            <th scope="row">{fila.nombreEtapa}</th>
            <td>{fila.horasVendidas}</td>
            <td>{fila.horasReales}</td>
            <td>{fila.desvioHoras}</td>
            <td>{formatearPorcentaje(fila.porcentajeConsumo)}</td>
            <td>
              {fila.alertaDesvio ? (
                <span role="status" className={estilos.alerta}>Alerta de desvío de horas</span>
              ) : null}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
