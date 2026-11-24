import clsx from 'clsx';
import { Link, useInRouterContext } from 'react-router-dom';
import type { EstadoSemaforo, TarjetaOrdenDTO } from '@velco/domain';
import { BadgePlano } from '../../ordenes/components/BadgePlano.tsx';
import estilos from './TarjetaOrden.module.css';

const CLASE_ESTADO: Record<EstadoSemaforo, string> = {
  Terminado: estilos.gris ?? '',
  Atrasado: estilos.rojo ?? '',
  'En riesgo': estilos.amarillo ?? '',
  'En plazo': estilos.verde ?? '',
};

interface Props {
  tarjeta: TarjetaOrdenDTO;
  onAlternarEtapa: (ordenId: string, etapaId: string, completada: boolean) => void;
}

export function TarjetaOrden({ tarjeta, onAlternarEtapa }: Props) {
  const estado: EstadoSemaforo = tarjeta.semaforo;
  const enRouter = useInRouterContext();
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
