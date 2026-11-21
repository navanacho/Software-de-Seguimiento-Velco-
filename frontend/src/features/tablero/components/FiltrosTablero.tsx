import type { FiltrosTablero as Filtros } from '../../../shared/domain-client/consultarTablero.ts';
import { ESTADOS } from '../../../shared/domain-client/esquemas.ts';

interface ClienteOpcion { clienteId: string; clienteNombre: string }
interface Props {
  filtros: Filtros;
  clientes: readonly ClienteOpcion[];
  etapas: readonly string[];
  onChange: (filtros: Filtros) => void;
  onLimpiar: () => void;
}

export function FiltrosTablero({ filtros, clientes, etapas, onChange, onLimpiar }: Props) {
  return (
    <section data-testid="filtros-tablero">
      <label>Cliente
        <select aria-label="Cliente" value={filtros.clienteId ?? ''} onChange={(e) => { const v = e.target.value; const siguiente = { ...filtros }; if (v) siguiente.clienteId = v; else delete (siguiente as Record<string, unknown>).clienteId; onChange(siguiente); }}>
          <option value="">Todos</option>
          {clientes.map((c) => <option key={c.clienteId} value={c.clienteId}>{c.clienteNombre}</option>)}
        </select>
      </label>
      <label>Estado
        <select aria-label="Estado" value={filtros.estado ?? ''} onChange={(e) => { const v = e.target.value; const siguiente = { ...filtros }; if (v) siguiente.estado = v; else delete (siguiente as Record<string, unknown>).estado; onChange(siguiente); }}>
          <option value="">Todos</option>
          {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
      </label>
      <label>Etapa ahora
        <select aria-label="Etapa ahora" value={filtros.etapaAhora ?? ''} onChange={(e) => { const v = e.target.value; const siguiente = { ...filtros }; if (v) siguiente.etapaAhora = v; else delete (siguiente as Record<string, unknown>).etapaAhora; onChange(siguiente); }}>
          <option value="">Todas</option>
          {etapas.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
      </label>
      <label>Buscar
        <input aria-label="Buscar" value={filtros.buscar ?? ''} onChange={(e) => { const v = e.target.value; const siguiente = { ...filtros }; if (v) siguiente.buscar = v; else delete (siguiente as Record<string, unknown>).buscar; onChange(siguiente); }} />
      </label>
      <button onClick={onLimpiar}>Limpiar filtros</button>
    </section>
  );
}
