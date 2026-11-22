import { useState } from 'react';
import { EsquemaAltaEtapa } from '../../../shared/domain-client/esquemas.ts';
import type { EtapaFormulario } from '../tiposFormulario.ts';
import estilos from './EditorEtapas.module.css';

interface Props {
  readonly etapas: readonly EtapaFormulario[];
  readonly onChange: (etapas: readonly EtapaFormulario[], modificadas: boolean) => void;
  readonly onAltaEtapa?: ((nombre: string, horasVendidas: string) => Promise<readonly EtapaFormulario[]>) | undefined;
  readonly onBajaEtapa?: ((etapaId: string) => Promise<readonly EtapaFormulario[]>) | undefined;
  readonly onReordenarEtapa?: ((etapaId: string, ordenSecuencia: number) => Promise<readonly EtapaFormulario[]>) | undefined;
}

function mensajeError(error: unknown): string {
  return error instanceof Error ? error.message : 'No se pudo modificar las etapas.';
}

export function EditorEtapas({ etapas, onChange, onAltaEtapa, onBajaEtapa, onReordenarEtapa }: Props) {
  const [nuevaEtapa, setNuevaEtapa] = useState('');
  const [error, setError] = useState('');

  function cambiar(indice: number, parcial: Partial<EtapaFormulario>) {
    onChange(etapas.map((etapa, i) => (i === indice ? { ...etapa, ...parcial } : etapa)), true);
  }

  async function agregar() {
    const resultado = EsquemaAltaEtapa.safeParse({ nombre: nuevaEtapa, horasVendidas: '0.00' });
    if (!resultado.success) {
      setError('El nombre de la etapa debe tener entre 1 y 100 caracteres.');
      return;
    }
    const nombre = resultado.data.nombre;
    const horasVendidas = resultado.data.horasVendidas ?? '0.00';
    try {
      if (onAltaEtapa) {
        onChange(await onAltaEtapa(nombre, horasVendidas), false);
      } else {
        onChange([...etapas, { nombre, horasVendidas }], true);
      }
      setError('');
      setNuevaEtapa('');
    } catch (error) {
      setError(mensajeError(error));
    }
  }

  async function quitar(indice: number) {
    const etapa = etapas[indice];
    if (etapa === undefined) return;
    try {
      if (onBajaEtapa && etapa.id !== undefined) {
        onChange(await onBajaEtapa(etapa.id), false);
      } else {
        onChange(etapas.filter((_, i) => i !== indice), true);
      }
      setError('');
    } catch (error) {
      setError(mensajeError(error));
    }
  }

  async function moverAlInicio(indice: number) {
    const etapa = etapas[indice];
    if (etapa === undefined || etapa.id === undefined || onReordenarEtapa === undefined || indice === 0) return;
    try {
      onChange(await onReordenarEtapa(etapa.id, 1), false);
      setError('');
    } catch (error) {
      setError(mensajeError(error));
    }
  }

  return (
    <section className={estilos.editor} aria-label="Etapas">
      <h2>Etapas</h2>
      <ol>
        {etapas.map((etapa, indice) => (
          <li key={etapa.id ?? `nueva-${indice}`}>
            {etapa.id === undefined ? (
              <>
                <label htmlFor={`etapa-${indice}`}>Etapa {indice + 1}</label>
                <input
                  id={`etapa-${indice}`}
                  value={etapa.nombre}
                  onChange={(evento) => cambiar(indice, { nombre: evento.target.value })}
                />
              </>
            ) : (
              <p data-testid={`nombre-etapa-${indice}`}>{etapa.nombre}</p>
            )}
            {etapa.id === undefined ? (
              <>
                <label htmlFor={`horas-${indice}`}>Horas vendidas {indice + 1}</label>
                <input
                  id={`horas-${indice}`}
                  value={etapa.horasVendidas}
                  onChange={(evento) => cambiar(indice, { horasVendidas: evento.target.value })}
                />
              </>
            ) : (
              <p>Horas vendidas {indice + 1}: <span data-testid={`horas-etapa-${indice}`}>{etapa.horasVendidas}</span></p>
            )}
            {onReordenarEtapa !== undefined && etapa.id !== undefined && indice > 0 ? (
              <button
                type="button"
                aria-label={`Mover ${etapa.nombre} al inicio`}
                onClick={() => { void moverAlInicio(indice); }}
              >
                Mover al inicio
              </button>
            ) : null}
            <button type="button" onClick={() => { void quitar(indice); }}>
              Quitar
            </button>
          </li>
        ))}
      </ol>
      <label htmlFor="nueva-etapa">Nueva etapa</label>
      <input id="nueva-etapa" value={nuevaEtapa} onChange={(evento) => setNuevaEtapa(evento.target.value)} />
      <button type="button" onClick={() => { void agregar(); }}>Agregar etapa</button>
      {error ? <p role="alert">{error}</p> : null}
    </section>
  );
}
