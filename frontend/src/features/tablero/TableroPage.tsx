import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTablero } from './hooks/useTablero.ts';
import { useActualizarEtapa } from './hooks/useActualizarEtapa.ts';
import type { FiltrosTablero } from '../../shared/domain-client/consultarTablero.ts';
import { KpisTablero } from './components/KpisTablero.tsx';
import { TiraFlujo } from './components/TiraFlujo.tsx';
import { FiltrosTablero as ControlesFiltros } from './components/FiltrosTablero.tsx';
import { TarjetaOrden } from './components/TarjetaOrden.tsx';
import { EstadoVacioTablero } from './components/EstadoVacioTablero.tsx';
import estilos from './TableroPage.module.css';

const FILTROS_VACIOS: FiltrosTablero = {};

export function TableroPage() {
  const [filtros, setFiltros] = useState<FiltrosTablero>(FILTROS_VACIOS);
  const [clientesBase, setClientesBase] = useState<{ clienteId: string; clienteNombre: string }[]>([]);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useTablero(filtros);
  const mutacion = useActualizarEtapa();
  const nuevaOp = () => { navigate('/ops/nueva'); };

  const hayFiltrosActivos = Object.values(filtros).some((v) => typeof v === 'string' && v.trim() !== '');

  useEffect(() => {
    if (hayFiltrosActivos || !data) return;
    const mapa = new Map<string, string>();
    for (const op of data.ops) {
      if (op.clienteNombre) mapa.set(op.clienteId, op.clienteNombre);
    }
    const siguiente = Array.from(mapa, ([clienteId, clienteNombre]) => ({ clienteId, clienteNombre }))
      .sort((a, b) => a.clienteNombre.localeCompare(b.clienteNombre));
    setClientesBase((prev) => (prev.length === 0 ? siguiente : prev));
  }, [data, hayFiltrosActivos]);

  const clientes = useMemo(() => {
    const mapa = new Map(clientesBase.map((c) => [c.clienteId, c.clienteNombre]));
    if (filtros.clienteId && !mapa.has(filtros.clienteId)) {
      const actual = data?.ops.find((o) => o.clienteId === filtros.clienteId);
      if (actual?.clienteNombre) mapa.set(actual.clienteId, actual.clienteNombre);
    }
    return Array.from(mapa, ([clienteId, clienteNombre]) => ({ clienteId, clienteNombre }));
  }, [clientesBase, data?.ops, filtros.clienteId]);

  const etapas = useMemo(() => (data?.flujo ?? []).map((g) => g.etapa), [data?.flujo]);

  const limpiar = () => setFiltros(FILTROS_VACIOS);
  const recargar = () => { void queryClient.invalidateQueries({ queryKey: ['tablero'] }); };

  return (
    <main className={estilos.pagina} data-testid="tablero-page">
      <header className={estilos.encabezado}>
        <div className={estilos.franja} aria-hidden="true" />
        <h1 className={estilos.titulo}>Tablero de producción</h1>
        <div className={estilos.acciones}>
          <button type="button" onClick={nuevaOp}>Nueva OP</button>
        </div>
      </header>
      <ControlesFiltros filtros={filtros} clientes={clientes} etapas={etapas} onChange={setFiltros} onLimpiar={limpiar} />
      {isLoading ? <p>Cargando tablero...</p> : null}
      {isError ? <p role="alert">No se pudo cargar el tablero</p> : null}
      {data ? <KpisTablero kpis={data.kpis} /> : null}
      {data ? <TiraFlujo flujo={data.flujo} /> : null}
      {data && data.ops.length === 0 ? (
        <EstadoVacioTablero
          hayFiltrosActivos={hayFiltrosActivos}
          onNuevaOp={nuevaOp}
          onLimpiar={limpiar}
          onRecargar={recargar}
        />
      ) : null}
      {data && data.ops.length > 0 ? (
        <section className={estilos.grilla} data-testid="grilla-tarjetas">
          {data.ops.map((op) => (
            <TarjetaOrden
              key={op.id}
              tarjeta={op}
              onAlternarEtapa={(ordenId, etapaId, completada) => mutacion.mutate({ ordenId, etapaId, completada })}
            />
          ))}
        </section>
      ) : null}
      {mutacion.isError ? <p role="alert">No se pudo actualizar la etapa</p> : null}
    </main>
  );
}
