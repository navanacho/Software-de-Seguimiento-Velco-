import { useState } from 'react';
import { useOrden } from './hooks/useOrden.ts';
import { useGuardarOrden } from './hooks/useGuardarOrden.ts';
import { useAltaClienteInline } from './hooks/useAltaClienteInline.ts';
import { useAltaMaterial } from './hooks/useAltaMaterial.ts';
import { useEditorEtapas } from './hooks/useEditorEtapas.ts';
import { useEtapasPrecargadas } from './hooks/useEtapasPrecargadas.ts';
import { FormularioOrden } from './components/FormularioOrden.tsx';
import type { ClienteOpcion, ErroresFormulario, ValoresFormulario } from './tiposFormulario.ts';
import estilos from './OrdenFormPage.module.css';

interface Props {
  readonly ordenId?: string;
  readonly clientes?: readonly ClienteOpcion[];
}

export function OrdenFormPage({ ordenId, clientes = [] }: Props) {
  const esEdicion = typeof ordenId === 'string' && ordenId.trim() !== '';
  const { data, isLoading, isError } = useOrden(ordenId);
  const [errores, setErrores] = useState<ErroresFormulario | undefined>();
  const guardar = useGuardarOrden({ ordenId, onError: setErrores });
  const altaCliente = useAltaClienteInline();
  const altaMaterial = useAltaMaterial(ordenId ?? '');
  const editorEtapas = useEditorEtapas(ordenId ?? '');
  const etapasPrecargadas = useEtapasPrecargadas(!esEdicion);

  const valoresIniciales: Partial<ValoresFormulario> | undefined = data
    ? {
        numeroOp: data.numeroOp,
        codigoPlano: data.codigoPlano,
        clienteNombre: data.clienteNombre ?? '',
        descripcionPieza: data.descripcionPieza,
        fechaEntrega: data.fechaEntrega,
        montoVendido: data.montoVendido,
        observaciones: data.observaciones,
        etapas: data.etapas.map((etapa) => ({
          id: etapa.id,
          nombre: etapa.nombre,
          horasVendidas: etapa.horasVendidas,
        })),
        materiales: data.materiales.map((material) => ({
          tipo: material.tipo,
          descripcion: material.descripcion,
          cantidad: material.cantidad,
          unidad: material.unidad,
          costoUnitarioCotizado: material.costoUnitarioCotizado,
        })),
      }
    : undefined;

  return (
    <main data-testid="formulario-orden-page" className={estilos.pagina}>
      <h1>{esEdicion ? 'Editar orden' : 'Nueva orden'}</h1>
      {isLoading ? <p>Cargando orden...</p> : null}
      {isError ? <p role="alert">No se pudo cargar la orden</p> : null}
      {data ? (
        <p data-testid="derivados-etapas">
          Avance: {data.avance}% — Etapa actual: {data.etapaAhora} — Semáforo: {data.semaforo}
        </p>
      ) : null}
      {!esEdicion || data ? (
        <FormularioOrden
          modo={esEdicion ? 'edicion' : 'alta'}
          clientes={clientes}
          valoresIniciales={valoresIniciales}
          etapasPrecargadas={etapasPrecargadas}
          fechaIngreso={data?.fechaIngreso ?? null}
          errores={errores}
          onGuardar={(valores) => { guardar.mutate(valores); }}
          onAltaCliente={(nombre) => altaCliente.mutateAsync(nombre)}
          onAltaMaterial={esEdicion ? (cuerpo) => altaMaterial.mutateAsync(cuerpo) : undefined}
          onAltaEtapa={esEdicion ? (nombre, horasVendidas) => editorEtapas.alta(nombre, horasVendidas) : undefined}
          onBajaEtapa={esEdicion ? (etapaId) => editorEtapas.baja(etapaId) : undefined}
          onReordenarEtapa={esEdicion ? (etapaId, ordenSecuencia) => editorEtapas.reordenar(etapaId, ordenSecuencia) : undefined}
        />
      ) : null}
    </main>
  );
}
