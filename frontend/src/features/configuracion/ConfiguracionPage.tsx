import { ErrorApi } from '../../shared/domain-client/errores.ts';
import { FormularioConfiguracion } from './components/FormularioConfiguracion.tsx';
import { useConfiguracion } from './hooks/useConfiguracion.ts';
import { useGuardarConfiguracion } from './hooks/useGuardarConfiguracion.ts';
import estilos from './ConfiguracionPage.module.css';

export function ConfiguracionPage() {
  const { data, isLoading, isError } = useConfiguracion();
  const guardar = useGuardarConfiguracion();
  const erroresApi = guardar.error instanceof ErrorApi && guardar.error.causa.tipo === 'validation_error'
    ? guardar.error.causa.detalles
    : [];

  return (
    <main className={estilos.pagina} data-testid="configuracion-page">
      <h1>Configuración global</h1>
      {isLoading ? <p>Cargando configuración...</p> : null}
      {isError ? <p role="alert">No se pudo cargar la configuración</p> : null}
      {data ? (
        <FormularioConfiguracion
          configuracion={data}
          erroresApi={erroresApi}
          guardado={guardar.isSuccess}
          onGuardar={(cuerpo) => guardar.mutate(cuerpo)}
        />
      ) : null}
    </main>
  );
}
