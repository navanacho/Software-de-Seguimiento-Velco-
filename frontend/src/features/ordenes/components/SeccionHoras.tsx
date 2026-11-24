import { useEffect, useState } from 'react';
import { mensajeErrorEliminar } from '../mensajeErrorEliminar.ts';
import type { EtapaDetalleDTO, ParteHoraDTO } from '../../../shared/domain-client/tipos.ts';
import {
  useCargarHora,
  useEditarHora,
  useEliminarHora,
  useHoras,
} from '../hooks/useHoras.ts';
import { FormularioHora } from './FormularioHora.tsx';
import estilos from './SeccionHoras.module.css';

interface Derivados {
  readonly horasVendidasTotales: string;
  readonly horasRealesTotales: string;
  readonly desvioHoras: string;
  readonly porcentajeConsumo: string | null;
  readonly alertaDesvio: boolean;
}

interface Props {
  readonly ordenId: string;
  readonly etapas: readonly EtapaDetalleDTO[];
  readonly derivados: Derivados;
  readonly hoy?: string | undefined;
  readonly abrirModalInicial?: boolean | undefined;
}

type Modal = 'crear' | ParteHoraDTO | null;

export function SeccionHoras({ ordenId, etapas, derivados, hoy, abrirModalInicial = false }: Props) {
  const { data: partes = [], isLoading } = useHoras(ordenId);
  const cargar = useCargarHora(ordenId);
  const editar = useEditarHora(ordenId);
  const eliminar = useEliminarHora(ordenId);
  const [modal, setModal] = useState<Modal>(null);
  const errorEliminar = eliminar.isError ? mensajeErrorEliminar(eliminar.error) : null;

  useEffect(() => {
    if (abrirModalInicial) setModal('crear');
  }, [abrirModalInicial]);

  return (
    <section className={estilos.seccion} aria-label="Horas">
      <h2>Horas</h2>
      <dl className={estilos.derivados}>
        <div>
          <dt>Horas vendidas</dt>
          <dd>{derivados.horasVendidasTotales}</dd>
        </div>
        <div>
          <dt>Horas reales</dt>
          <dd>{derivados.horasRealesTotales}</dd>
        </div>
        <div>
          <dt>Desvío</dt>
          <dd>{derivados.desvioHoras}</dd>
        </div>
        <div>
          <dt>Consumo</dt>
          <dd>{derivados.porcentajeConsumo ?? '—'}</dd>
        </div>
      </dl>
      {derivados.alertaDesvio ? <p role="status">Alerta de desvío de horas</p> : null}

      <button type="button" onClick={() => setModal('crear')}>Cargar horas</button>

      {isLoading ? <p>Cargando partes de horas...</p> : null}
      {!isLoading && partes.length === 0 ? <p>Sin partes registradas.</p> : null}
      <ul className={estilos.partes}>
        {partes.map((parte) => (
          <li key={parte.id}>
            <span>{parte.fecha} — {parte.operario} — {parte.horas}</span>
            {parte.etapaId ? <span>Etapa: {parte.etapaId}</span> : null}
            {parte.observacion ? <span>Observación: {parte.observacion}</span> : null}
            <button type="button" aria-label="Editar parte" onClick={() => setModal(parte)}>Editar</button>
            <button
              type="button"
              aria-label="Eliminar parte"
              disabled={eliminar.isPending}
              onClick={() => { void eliminar.mutate(parte.id); }}
            >
              Eliminar
            </button>
          </li>
        ))}
      </ul>

      {errorEliminar ? (
        <div className={estilos.error} role="alert">
          <p>{errorEliminar}</p>
          <button
            type="button"
            onClick={() => {
              if (eliminar.variables) void eliminar.mutate(eliminar.variables);
            }}
          >
            Reintentar eliminación
          </button>
        </div>
      ) : null}

      {modal !== null ? (
        <div className={estilos.modal} role="dialog" aria-modal="true" aria-label={modal === 'crear' ? 'Cargar horas' : 'Editar horas'}>
          <FormularioHora
            etapas={etapas}
            hoy={hoy}
            parte={modal === 'crear' ? undefined : modal}
            onCancelar={() => setModal(null)}
            onSubmit={async (cuerpo) => {
              if (modal === 'crear') await cargar.mutateAsync(cuerpo);
              else await editar.mutateAsync({ parteId: modal.id, cambios: cuerpo });
              setModal(null);
            }}
          />
        </div>
      ) : null}
    </section>
  );
}
