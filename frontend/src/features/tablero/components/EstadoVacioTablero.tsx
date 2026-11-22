interface Props {
  hayFiltrosActivos: boolean;
  onNuevaOp: () => void;
  onLimpiar: () => void;
  onRecargar: () => void;
}

export function EstadoVacioTablero({ hayFiltrosActivos, onNuevaOp, onLimpiar, onRecargar }: Props) {
  return (
    <div data-testid="estado-vacio-tablero">
      <p>No hay órdenes para mostrar</p>
      <button type="button" onClick={onNuevaOp}>Nueva OP</button>
      {hayFiltrosActivos ? <button onClick={onLimpiar}>Limpiar filtros</button> : null}
      <button onClick={onRecargar}>Recargar tablero</button>
    </div>
  );
}
