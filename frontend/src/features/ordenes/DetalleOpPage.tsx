import { Link, useSearchParams } from 'react-router-dom';
import { useOrden } from './hooks/useOrden.ts';
import { BadgePlano } from './components/BadgePlano.tsx';
import { SeccionHoras } from './components/SeccionHoras.tsx';
import estilos from './DetalleOpPage.module.css';

interface Props {
  readonly ordenId: string;
}

export function DetalleOpPage({ ordenId }: Props) {
  const { data, isLoading, isError } = useOrden(ordenId);
  const [parametros] = useSearchParams();

  if (isLoading) {
    return <main data-testid="detalle-op-page" className={estilos.pagina}><p>Cargando orden...</p></main>;
  }
  if (isError || !data) {
    return <main data-testid="detalle-op-page" className={estilos.pagina}><p role="alert">No se pudo cargar la orden</p></main>;
  }

  return (
    <main data-testid="detalle-op-page" className={estilos.pagina}>
      <header data-testid="detalle-op-cabecera">
        <h1>Orden {data.numeroOp}</h1>
        <BadgePlano codigoPlano={data.codigoPlano} />
        <p>{data.clienteNombre ?? 'Sin cliente'}</p>
        <p>{data.descripcionPieza}</p>
      </header>
      <section aria-label="Estado">
        <p>Avance: {data.avance}%</p>
        <p>Semáforo: {data.semaforo}</p>
        <p>Etapa ahora: {data.etapaAhora}</p>
        <p>{data.etiquetaPlazo}</p>
        <p>Días restantes: {data.diasRestantes}</p>
      </section>
      <section aria-label="Etapas">
        <h2>Etapas</h2>
        <ul>
          {[...data.etapas]
            .sort((a, b) => a.ordenSecuencia - b.ordenSecuencia)
            .map((etapa) => (
              <li key={etapa.id}>
                {etapa.nombre} — horas vendidas: {etapa.horasVendidas}
              </li>
            ))}
        </ul>
      </section>
      <SeccionHoras
        ordenId={ordenId}
        etapas={data.etapas}
        derivados={{
          horasVendidasTotales: data.horasVendidasTotales,
          horasRealesTotales: data.horasRealesTotales,
          desvioHoras: data.desvioHoras,
          porcentajeConsumo: data.porcentajeConsumo,
          alertaDesvio: data.alertaDesvio,
        }}
        abrirModalInicial={parametros.get('accion') === 'cargar-horas'}
      />
      <section aria-label="Materiales">
        <h2>Materiales</h2>
        <ul>
          {data.materiales.map((material) => (
            <li key={material.id}>
              {material.tipo}: {material.descripcion} ({material.cantidad})
            </li>
          ))}
        </ul>
      </section>
      <Link to={`/ops/${ordenId}/editar`}>Editar</Link>
    </main>
  );
}
