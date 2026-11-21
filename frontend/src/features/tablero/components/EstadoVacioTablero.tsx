interface Props {
  hayFiltrosActivos: boolean;
  onLimpiar: () => void;
  onRecargar: () => void;
}

export function EstadoVacioTablero({ hayFiltrosActivos, onLimpiar, onRecargar }: Props) {
  return (
    <div data-testid="estado-vacio-tablero">
      <p>No hay órdenes para mostrar</p>
      {hayFiltrosActivos ? <button onClick={onLimpiar}>Limpiar filtros</button> : null}
      <button onClick={onRecargar}>Recargar tablero</button>
    </div>
  );
}
