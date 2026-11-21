import clsx from 'clsx';
import type { EstadoSemaforo, TarjetaOrdenDTO } from '@velco/domain';
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
  return (
    <article data-testid="tarjeta-orden" className={clsx(estilos.tarjeta, CLASE_ESTADO[estado])}>
      <h3>{tarjeta.numeroOp}</h3>
      <p>{tarjeta.clienteNombre ?? 'Sin cliente'}</p>
      <p>{tarjeta.descripcionPieza}</p>
      <p data-testid="tarjeta-avance">Avance: {tarjeta.avance}%</p>
      <p data-testid="tarjeta-dias-restantes">Días restantes: {tarjeta.diasRestantes}</p>
      <p data-testid="tarjeta-etiqueta-plazo">{tarjeta.etiquetaPlazo}</p>
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
    </article>
  );
}
