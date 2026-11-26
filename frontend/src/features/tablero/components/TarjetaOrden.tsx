import clsx from 'clsx';
import { Link, useInRouterContext } from 'react-router-dom';
import type { EstadoSemaforo, TarjetaOrdenDTO } from '@velco/domain';
import { BadgePlano } from '../../ordenes/components/BadgePlano.tsx';
import { formatearPorcentaje } from '../../../shared/domain-client/formatoDecimal.ts';
import estilos from './TarjetaOrden.module.css';

const CLASE_ESTADO: Record<EstadoSemaforo, string> = {
  Terminado: estilos.gris ?? '',
  Atrasado: estilos.rojo ?? '',
  'En riesgo': estilos.amarillo ?? '',
  'En plazo': estilos.verde ?? '',
};

function anchoTermometro(porcentaje: string | null): string {
  if (porcentaje === null) return '0%';
  const valor = Number(porcentaje);
  if (!Number.isFinite(valor)) return '0%';
  return `${Math.min(100, Math.max(0, valor))}%`;
}

interface Props {
  tarjeta: TarjetaOrdenDTO;
  onAlternarEtapa: (ordenId: string, etapaId: string, completada: boolean) => void;
}

export function TarjetaOrden({ tarjeta, onAlternarEtapa }: Props) {
  const estado: EstadoSemaforo = tarjeta.semaforo;
  const enRouter = useInRouterContext();
  const consumoFormateado = formatearPorcentaje(tarjeta.porcentajeConsumo);
  const anchoConsumo = anchoTermometro(tarjeta.porcentajeConsumo);
  const rutaDetalle = `/ops/${tarjeta.id}`;
  const rutaCargarHoras = `${rutaDetalle}?accion=cargar-horas`;
  return (
    <article data-testid="tarjeta-orden" className={clsx(estilos.tarjeta, CLASE_ESTADO[estado])}>
      <h3>{tarjeta.numeroOp}</h3>
      <BadgePlano codigoPlano={tarjeta.codigoPlano} />
      <p>{tarjeta.clienteNombre ?? 'Sin cliente'}</p>
      <p>{tarjeta.descripcionPieza}</p>
      <p data-testid="tarjeta-avance">Avance: {tarjeta.avance}%</p>
      <p data-testid="tarjeta-dias-restantes">Días restantes: {tarjeta.diasRestantes}</p>
      <p data-testid="tarjeta-etiqueta-plazo">{tarjeta.etiquetaPlazo}</p>
      <p data-testid="tarjeta-horas">
        Horas Reales / Horas Vendidas: {tarjeta.horasRealesTotales} / {tarjeta.horasVendidasTotales}
      </p>
      <div data-testid="barra-horas" className={estilos.barra} aria-hidden="true" />
      <div className={estilos.termometro}>
        <p data-testid="tarjeta-consumo">Consumo: {consumoFormateado}</p>
        <div
          data-testid="termometro-consumo"
          className={estilos.barra}
          aria-hidden="true"
          style={{ width: anchoConsumo, transition: 'width 600ms ease-in-out' }}
        />
      </div>
      {tarjeta.alertaDesvio === true
        ? <span data-testid="badge-alerta-desvio" role="status" className={clsx(estilos.alerta, estilos.rojo)}>Alerta de desvío de horas</span>
        : null}
      <ul>
        {[...tarjeta.etapas]
          .sort((a, b) => a.ordenSecuencia - b.ordenSecuencia)
          .map((e) => {
            const esAhora = e.nombre === tarjeta.etapaAhora && !e.completada;
            return (
              <li key={e.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={e.completada}
                    onChange={() => onAlternarEtapa(tarjeta.id, e.id, !e.completada)}
                  />
                  {e.nombre}
                </label>
                {esAhora ? <span data-testid="badge-ahora">ahora</span> : null}
              </li>
            );
          })}
        </ul>
        {enRouter ? <Link to={rutaDetalle}>Ver detalle</Link> : <a href={rutaDetalle}>Ver detalle</a>}
        {enRouter
          ? <Link to={rutaCargarHoras}>Cargar horas</Link>
          : <a href={rutaCargarHoras}>Cargar horas</a>}
    </article>
  );
}
