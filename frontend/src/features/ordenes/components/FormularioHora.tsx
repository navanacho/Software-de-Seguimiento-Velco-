import { useState, type FormEvent } from 'react';
import { fechaHoy } from '../fechaCalendario.ts';
import { EsquemaCargarHora, type CargarHoraEntrada } from '../../../shared/domain-client/esquemas.ts';
import type { EtapaDetalleDTO, ParteHoraDTO } from '../../../shared/domain-client/tipos.ts';
import estilos from './FormularioHora.module.css';

interface Props {
  readonly etapas: readonly EtapaDetalleDTO[];
  readonly hoy?: string | undefined;
  readonly parte?: ParteHoraDTO | undefined;
  readonly onSubmit: (cuerpo: CargarHoraEntrada) => Promise<void> | void;
  readonly onCancelar: () => void;
}

export function FormularioHora({ etapas, hoy, parte, onSubmit, onCancelar }: Props) {
  const [etapaId, setEtapaId] = useState(parte?.etapaId ?? '');
  const [operario, setOperario] = useState(parte?.operario ?? '');
  const [fecha, setFecha] = useState(parte?.fecha ?? hoy ?? fechaHoy());
  const [horas, setHoras] = useState(parte?.horas ?? '');
  const [observacion, setObservacion] = useState(parte?.observacion ?? '');
  const [error, setError] = useState('');

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const resultado = EsquemaCargarHora.safeParse({
      etapaId: etapaId === '' ? undefined : etapaId,
      operario,
      fecha,
      horas,
      observacion: observacion === '' ? undefined : observacion,
    });
    if (!resultado.success) {
      setError(resultado.error.issues[0]?.message ?? 'Revisá los datos del formulario.');
      return;
    }
    try {
      await onSubmit(resultado.data);
      setError('');
    } catch (errorEnviar: unknown) {
      setError(errorEnviar instanceof Error ? errorEnviar.message : 'No se pudo guardar la parte de horas.');
    }
  }

  return (
    <form className={estilos.formulario} onSubmit={(evento) => { void guardar(evento); }}>
      <label htmlFor="hora-etapa">Etapa</label>
      <select id="hora-etapa" value={etapaId} onChange={(evento) => setEtapaId(evento.target.value)}>
        <option value="">Sin etapa</option>
        {etapas.map((etapa) => (
          <option key={etapa.id} value={etapa.id}>{etapa.nombre}</option>
        ))}
      </select>

      <label htmlFor="hora-operario">Operario</label>
      <input id="hora-operario" value={operario} onChange={(evento) => setOperario(evento.target.value)} />

      <label htmlFor="hora-fecha">Fecha</label>
      <input id="hora-fecha" type="date" value={fecha} onChange={(evento) => setFecha(evento.target.value)} />

      <label htmlFor="hora-horas">Horas</label>
      <input id="hora-horas" value={horas} onChange={(evento) => setHoras(evento.target.value)} inputMode="decimal" />

      <label htmlFor="hora-observacion">Observación</label>
      <textarea id="hora-observacion" value={observacion} onChange={(evento) => setObservacion(evento.target.value)} />

      {error ? <p role="alert">{error}</p> : null}

      <div className={estilos.acciones}>
        <button type="submit">Guardar</button>
        <button type="button" onClick={onCancelar}>Cancelar</button>
      </div>
    </form>
  );
}
