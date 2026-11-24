import { useEffect, useState } from 'react';
import { Link, useInRouterContext } from 'react-router-dom';
import { TIPOS_MATERIAL } from '@velco/domain';
import {
  EsquemaActualizarOp,
  EsquemaAltaMaterial,
  EsquemaCrearOp,
} from '../../../shared/domain-client/esquemas.ts';
import type { AltaMaterialEntrada } from '../../../shared/domain-client/esquemas.ts';
import type { MaterialDetalleDTO } from '../../../shared/domain-client/tipos.ts';
import { EditorEtapas } from './EditorEtapas.tsx';
import { ETAPAS_PRECARGADAS } from '../precargaEtapas.ts';
import type {
  ClienteOpcion,
  ErroresFormulario,
  EtapaFormulario,
  MaterialFormulario,
  ValoresFormulario,
} from '../tiposFormulario.ts';
import estilos from './FormularioOrden.module.css';

const NUEVO_CLIENTE = '__nuevo__';

interface MaterialBorrador {
  tipo: string;
  descripcion: string;
  cantidad: string;
  unidad: string;
  costoUnitarioCotizado: string;
}

const BORRADOR_VACIO: MaterialBorrador = {
  tipo: 'MP',
  descripcion: '',
  cantidad: '',
  unidad: '',
  costoUnitarioCotizado: '',
};

function aMaterialFormulario(material: MaterialDetalleDTO): MaterialFormulario {
  return {
    tipo: material.tipo,
    descripcion: material.descripcion,
    cantidad: material.cantidad,
    unidad: material.unidad,
    costoUnitarioCotizado: material.costoUnitarioCotizado,
  };
}

interface Props {
  readonly modo: 'alta' | 'edicion';
  readonly clientes?: readonly ClienteOpcion[] | undefined;
  readonly valoresIniciales?: Partial<ValoresFormulario> | undefined;
  readonly etapasPrecargadas?: readonly EtapaFormulario[] | undefined;
  readonly fechaIngreso?: string | null | undefined;
  readonly errores?: ErroresFormulario | undefined;
  readonly onGuardar: (valores: ValoresFormulario) => void;
  readonly onAltaCliente?: ((nombre: string) => Promise<ClienteOpcion>) | undefined;
  readonly onAltaMaterial?: ((cuerpo: AltaMaterialEntrada) => Promise<MaterialDetalleDTO>) | undefined;
  readonly onAltaEtapa?: ((nombre: string, horasVendidas: string) => Promise<readonly EtapaFormulario[]>) | undefined;
  readonly onBajaEtapa?: ((etapaId: string) => Promise<readonly EtapaFormulario[]>) | undefined;
  readonly onReordenarEtapa?: ((etapaId: string, ordenSecuencia: number) => Promise<readonly EtapaFormulario[]>) | undefined;
}

function valoresPorDefecto(
  modo: Props['modo'],
  iniciales: Partial<ValoresFormulario> = {},
  etapasPrecargadas: readonly EtapaFormulario[] = ETAPAS_PRECARGADAS,
): ValoresFormulario {
  return {
    numeroOp: iniciales.numeroOp ?? '',
    codigoPlano: iniciales.codigoPlano ?? null,
    clienteNombre: iniciales.clienteNombre ?? '',
    descripcionPieza: iniciales.descripcionPieza ?? '',
    fechaEntrega: iniciales.fechaEntrega ?? '',
    montoVendido: iniciales.montoVendido ?? '',
    observaciones: iniciales.observaciones ?? null,
    etapas: iniciales.etapas ?? (modo === 'alta' ? etapasPrecargadas : []),
    etapasModificadas: iniciales.etapasModificadas ?? false,
    materiales: iniciales.materiales ?? [],
  };
}

export function FormularioOrden({
  modo,
  clientes = [],
  valoresIniciales,
  etapasPrecargadas = ETAPAS_PRECARGADAS,
  fechaIngreso = null,
  errores,
  onGuardar,
  onAltaCliente,
  onAltaMaterial,
  onAltaEtapa,
  onBajaEtapa,
  onReordenarEtapa,
}: Props) {
  const [valores, setValores] = useState<ValoresFormulario>(() => valoresPorDefecto(modo, valoresIniciales, etapasPrecargadas));
  const [etapasModificadas, setEtapasModificadas] = useState(valoresIniciales?.etapasModificadas ?? false);
  const [clientesLocales, setClientesLocales] = useState<readonly ClienteOpcion[]>(() => {
    const nombreInicial = valoresIniciales?.clienteNombre;
    const existe = clientes.some((cliente) => cliente.nombre === nombreInicial);
    return nombreInicial && !existe ? [...clientes, { id: 'inicial', nombre: nombreInicial }] : clientes;
  });
  const [clienteId, setClienteId] = useState(() => {
    const nombreInicial = valoresIniciales?.clienteNombre;
    return clientesLocales.find((cliente) => cliente.nombre === nombreInicial)?.id ?? NUEVO_CLIENTE;
  });
  const [nuevoNombreCliente, setNuevoNombreCliente] = useState('');
  const [borradorMaterial, setBorradorMaterial] = useState<MaterialBorrador>(BORRADOR_VACIO);
  const [erroresLocales, setErroresLocales] = useState<Readonly<Record<string, string>>>({});
  const [errorMaterial, setErrorMaterial] = useState('');
  const [errorCliente, setErrorCliente] = useState('');
  const enRouter = useInRouterContext();

  useEffect(() => {
    if (modo !== 'alta' || etapasModificadas) return;
    setValores((anteriores) => ({ ...anteriores, etapas: etapasPrecargadas }));
  }, [etapasPrecargadas, etapasModificadas, modo]);

  const erroresVisibles: Readonly<Record<string, string>> = { ...erroresLocales, ...errores?.campos };
  const mensajeGeneral = errores?.mensaje !== undefined && !Object.values(erroresVisibles).includes(errores.mensaje)
    ? errores.mensaje
    : undefined;

  function actualizar(parcial: Partial<ValoresFormulario>) {
    setValores((anteriores) => ({ ...anteriores, ...parcial }));
  }

  function cambiarEtapas(etapas: readonly EtapaFormulario[], modificadas: boolean) {
    setEtapasModificadas(modificadas);
    actualizar({ etapas, etapasModificadas: modificadas });
  }

  function elegirCliente(id: string) {
    setClienteId(id);
    const cliente = clientesLocales.find((opcion) => opcion.id === id);
    if (cliente) actualizar({ clienteNombre: cliente.nombre });
  }

  async function confirmarCliente() {
    const nombre = nuevoNombreCliente.trim();
    if (nombre === '') {
      setErrorCliente('Ingrese el nombre del cliente.');
      return;
    }
    try {
      const cliente = onAltaCliente
        ? await onAltaCliente(nombre)
        : { id: `temporal-${nombre}`, nombre };
      setClientesLocales((anteriores) =>
        anteriores.some((opcion) => opcion.id === cliente.id) ? anteriores : [...anteriores, cliente],
      );
      setClienteId(cliente.id);
      actualizar({ clienteNombre: cliente.nombre });
      setNuevoNombreCliente('');
      setErrorCliente('');
    } catch (error) {
      setErrorCliente(error instanceof Error ? error.message : 'No se pudo dar de alta el cliente.');
    }
  }

  async function agregarMaterial() {
    const candidato = {
      tipo: borradorMaterial.tipo,
      descripcion: borradorMaterial.descripcion,
      cantidad: borradorMaterial.cantidad,
      unidad: borradorMaterial.unidad.trim() === '' ? null : borradorMaterial.unidad.trim(),
      costoUnitarioCotizado: borradorMaterial.costoUnitarioCotizado,
    };
    const resultado = EsquemaAltaMaterial.safeParse(candidato);
    if (!resultado.success) {
      setErrorMaterial('Revise el tipo, la descripción y los importes del material.');
      return;
    }
    try {
      const guardado = onAltaMaterial ? await onAltaMaterial(resultado.data) : undefined;
      const material: MaterialFormulario = guardado
        ? aMaterialFormulario(guardado)
        : {
            tipo: resultado.data.tipo,
            descripcion: resultado.data.descripcion,
            cantidad: resultado.data.cantidad,
            unidad: resultado.data.unidad ?? null,
            costoUnitarioCotizado: resultado.data.costoUnitarioCotizado,
          };
      setValores((anteriores) => ({ ...anteriores, materiales: [...anteriores.materiales, material] }));
      setBorradorMaterial(BORRADOR_VACIO);
      setErrorMaterial('');
    } catch (error) {
      setErrorMaterial(error instanceof Error ? error.message : 'No se pudo agregar el material.');
    }
  }

  function enviar() {
    const payload = {
      numeroOp: valores.numeroOp,
      codigoPlano: valores.codigoPlano,
      clienteNombre: valores.clienteNombre,
      descripcionPieza: valores.descripcionPieza,
      fechaEntrega: valores.fechaEntrega,
      montoVendido: valores.montoVendido,
      observaciones: valores.observaciones,
      ...(modo === 'alta'
        ? {
            materiales: valores.materiales,
            ...(etapasModificadas ? { etapas: valores.etapas } : {}),
          }
        : {}),
    };
    const esquema = modo === 'alta' ? EsquemaCrearOp : EsquemaActualizarOp;
    const resultado = esquema.safeParse(payload);
    if (!resultado.success) {
      const nuevosErrores: Record<string, string> = {};
      for (const issue of resultado.error.issues) {
        const campo = String(issue.path[0] ?? 'formulario');
        if (nuevosErrores[campo] === undefined) nuevosErrores[campo] = issue.message;
      }
      setErroresLocales(nuevosErrores);
      return;
    }
    setErroresLocales({});
    onGuardar(valores);
  }

  function CampoError({ campo }: { readonly campo: string }) {
    const mensaje = erroresVisibles[campo];
    return mensaje ? <p data-testid={`error-${campo}`} role="alert">{mensaje}</p> : null;
  }

  return (
    <form className={estilos.formulario} onSubmit={(evento) => { evento.preventDefault(); enviar(); }}>
      <label htmlFor="numero-op">N° OP</label>
      <input
        id="numero-op"
        aria-label="N° OP"
        aria-invalid={erroresVisibles.numeroOp !== undefined}
        value={valores.numeroOp}
        onChange={(evento) => actualizar({ numeroOp: evento.target.value })}
      />
      <CampoError campo="numeroOp" />

      <label htmlFor="codigo-plano">ID de plano</label>
      <input
        id="codigo-plano"
        aria-label="ID de plano"
        placeholder="Opcional — Ej: PL-2026-045"
        aria-invalid={erroresVisibles.codigoPlano !== undefined}
        value={valores.codigoPlano ?? ''}
        onChange={(evento) => actualizar({ codigoPlano: evento.target.value.trim() === '' ? null : evento.target.value })}
      />
      <CampoError campo="codigoPlano" />
      {errores?.opExistente ? (
        enRouter
          ? <Link to={`/ops/${errores.opExistente.id}`}>Ver OP {errores.opExistente.numeroOp}</Link>
          : <a href={`/ops/${errores.opExistente.id}`}>Ver OP {errores.opExistente.numeroOp}</a>
      ) : null}

      <label htmlFor="cliente">Cliente</label>
      <select id="cliente" aria-label="Cliente" value={clienteId} onChange={(evento) => elegirCliente(evento.target.value)}>
        <option value="">Seleccione cliente</option>
        {clientesLocales.map((cliente) => (
          <option key={cliente.id} value={cliente.id}>{cliente.nombre}</option>
        ))}
        <option value={NUEVO_CLIENTE}>Nuevo cliente</option>
      </select>
      <CampoError campo="clienteNombre" />
      {clienteId === NUEVO_CLIENTE ? (
        <>
          <label htmlFor="nuevo-cliente">Nombre del cliente</label>
          <input
            id="nuevo-cliente"
            aria-label="Nombre del cliente"
            value={nuevoNombreCliente}
            onChange={(evento) => setNuevoNombreCliente(evento.target.value)}
          />
          <button type="button" onClick={() => { void confirmarCliente(); }}>Confirmar cliente</button>
          {errorCliente ? <p role="alert">{errorCliente}</p> : null}
        </>
      ) : null}

      <label htmlFor="descripcion-pieza">Descripción de la pieza</label>
      <input
        id="descripcion-pieza"
        aria-label="Descripción de la pieza"
        value={valores.descripcionPieza}
        onChange={(evento) => actualizar({ descripcionPieza: evento.target.value })}
      />
      <CampoError campo="descripcionPieza" />

      {fechaIngreso ? <p data-testid="fecha-ingreso">Fecha de ingreso: {fechaIngreso}</p> : null}

      <label htmlFor="fecha-entrega">Fecha de entrega</label>
      <input
        id="fecha-entrega"
        aria-label="Fecha de entrega"
        value={valores.fechaEntrega}
        onChange={(evento) => actualizar({ fechaEntrega: evento.target.value })}
      />
      <CampoError campo="fechaEntrega" />

      <label htmlFor="monto-vendido">Monto vendido</label>
      <input
        id="monto-vendido"
        aria-label="Monto vendido"
        value={valores.montoVendido}
        onChange={(evento) => actualizar({ montoVendido: evento.target.value })}
      />
      <CampoError campo="montoVendido" />

      <label htmlFor="observaciones">Observaciones</label>
      <textarea
        id="observaciones"
        aria-label="Observaciones"
        value={valores.observaciones ?? ''}
        onChange={(evento) => actualizar({ observaciones: evento.target.value })}
      />

      <EditorEtapas
        etapas={valores.etapas}
        onChange={cambiarEtapas}
        onAltaEtapa={onAltaEtapa}
        onBajaEtapa={onBajaEtapa}
        onReordenarEtapa={onReordenarEtapa}
      />

      <section aria-label="Materiales">
        <h2>Materiales</h2>
        <label htmlFor="tipo-material">Tipo de material</label>
        <select
          id="tipo-material"
          aria-label="Tipo de material"
          value={borradorMaterial.tipo}
          onChange={(evento) => setBorradorMaterial((anterior) => ({ ...anterior, tipo: evento.target.value }))}
        >
          {TIPOS_MATERIAL.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
        </select>
        <label htmlFor="descripcion-material">Descripción del material</label>
        <input
          id="descripcion-material"
          aria-label="Descripción del material"
          value={borradorMaterial.descripcion}
          onChange={(evento) => setBorradorMaterial((anterior) => ({ ...anterior, descripcion: evento.target.value }))}
        />
        <label htmlFor="cantidad">Cantidad</label>
        <input
          id="cantidad"
          aria-label="Cantidad"
          value={borradorMaterial.cantidad}
          onChange={(evento) => setBorradorMaterial((anterior) => ({ ...anterior, cantidad: evento.target.value }))}
        />
        <label htmlFor="unidad">Unidad</label>
        <input
          id="unidad"
          aria-label="Unidad"
          value={borradorMaterial.unidad}
          onChange={(evento) => setBorradorMaterial((anterior) => ({ ...anterior, unidad: evento.target.value }))}
        />
        <label htmlFor="costo-unitario">Costo unitario cotizado</label>
        <input
          id="costo-unitario"
          aria-label="Costo unitario cotizado"
          value={borradorMaterial.costoUnitarioCotizado}
          onChange={(evento) => setBorradorMaterial((anterior) => ({ ...anterior, costoUnitarioCotizado: evento.target.value }))}
        />
        <button type="button" onClick={() => { void agregarMaterial(); }}>Agregar material</button>
        {errorMaterial ? <p data-testid="error-material" role="alert">{errorMaterial}</p> : null}
        <ul>
          {valores.materiales.map((material, indice) => (
            <li key={`${material.descripcion}-${indice}`} data-testid="material-agregado">
              {material.tipo}: {material.descripcion} — {material.cantidad}
            </li>
          ))}
        </ul>
      </section>

      {mensajeGeneral ? <p role="alert">{mensajeGeneral}</p> : null}
      <button type="submit">Guardar</button>
    </form>
  );
}

export type { Props as FormularioOrdenProps };
