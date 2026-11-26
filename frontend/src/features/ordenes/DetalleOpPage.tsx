import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useOrden } from './hooks/useOrden.ts';
import { AnalisisRentabilidad } from './components/AnalisisRentabilidad.tsx';
import { BadgePlano } from './components/BadgePlano.tsx';
import { SeccionHoras } from './components/SeccionHoras.tsx';
import estilos from './DetalleOpPage.module.css';

interface Props {
  readonly ordenId: string;
}

type Pestana = 'detalle' | 'analisis';

export function DetalleOpPage({ ordenId }: Props) {
  const { data, isLoading, isError } = useOrden(ordenId);
  const [parametros] = useSearchParams();
  const [pestana, setPestana] = useState<Pestana>('detalle');

  if (isLoading) {
    return <main data-testid="detalle-op-page" className={estilos.pagina}><p>Cargando orden...</p></main>;
  }
  if (isError || !data) {
    return <main data-testid="detalle-op-page" className={estilos.pagina}><p role="alert">No se pudo cargar la orden</p></main>;
  }

  return (
    <main data-testid="detalle-op-page" className={estilos.pagina}>
      <div role="tablist" aria-label="Vistas de la orden" className={estilos.pestanias}>
        <button
          type="button"
          role="tab"
          id="pestana-detalle"
          aria-selected={pestana === 'detalle'}
          aria-controls="panel-detalle"
          onClick={() => setPestana('detalle')}
        >
          Detalle
        </button>
        <button
          type="button"
          role="tab"
          id="pestana-analisis"
          aria-selected={pestana === 'analisis'}
          aria-controls="panel-analisis"
          onClick={() => setPestana('analisis')}
        >
          Análisis de Rentabilidad
        </button>
      </div>
      {pestana === 'detalle' ? (
        <div role="tabpanel" id="panel-detalle" aria-labelledby="pestana-detalle" className={estilos.contenido}>
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
        </div>
      ) : (
        <div role="tabpanel" id="panel-analisis" aria-labelledby="pestana-analisis" className={estilos.contenido}>
          <AnalisisRentabilidad detalle={data} />
        </div>
      )}
    </main>
  );
}
