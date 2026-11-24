import type { Cliente, Configuracion, EtapaOrden, NuevoRegistroHora, OrdenTrabajo, RegistroHora } from '@velco/domain';
import type { DependenciasApi } from '../../src/shared/dependencias.ts';
import type { ConfiguracionServidor } from '../../src/shared/configuracion.ts';

export const ZONA_PRUEBA = 'America/Argentina/Mendoza';
export const INSTANTE_FIJO = new Date('2026-03-08T12:00:00.000Z');

export function configuracionPrueba(): ConfiguracionServidor {
  return {
    puerto: 3001,
    origenCors: 'http://localhost:5173',
    baseUncExcel: '',
    zonaHoraria: ZONA_PRUEBA,
  };
}

export function crearOrden(cambios: Partial<OrdenTrabajo> = {}): OrdenTrabajo {
  return {
    id: 'op-1',
    numeroOp: 'OT-1001',
    codigoPlano: null,
    clienteId: 'cli-1',
    descripcionPieza: 'Eje de transmisi\u00f3n',
    fechaIngreso: '2026-03-01',
    fechaEntrega: '2026-03-12',
    montoVendido: '1250.50',
    observaciones: null,
    createdAt: '2026-03-01T08:00:00.000Z',
    updatedAt: '2026-03-01T08:00:00.000Z',
    ...cambios,
  };
}

export function crearEtapa(cambios: Partial<EtapaOrden> = {}): EtapaOrden {
  return {
    id: 'etapa-1',
    ordenId: 'op-1',
    nombre: 'Corte',
    ordenSecuencia: 1,
    completada: false,
    horasVendidas: '4.00',
    ...cambios,
  };
}

export function crearEtapas(
  nombres: readonly string[],
  ordenId = 'op-1',
  completadasHasta = 0,
): EtapaOrden[] {
  return nombres.map((nombre, indice) =>
    crearEtapa({
      id: `${ordenId}-etapa-${indice + 1}`,
      ordenId,
      nombre,
      ordenSecuencia: indice + 1,
      completada: indice < completadasHasta,
      horasVendidas: `${indice + 1}.50`,
    }),
  );
}

export function crearRegistroHora(cambios: Partial<RegistroHora> = {}): RegistroHora {
  return {
    id: 'hora-1',
    ordenId: 'op-1',
    etapaId: null,
    operario: 'Ana',
    fecha: '2026-03-05',
    horas: '2.50',
    createdAt: '2026-03-05T10:00:00.000Z',
    observacion: null,
    ...cambios,
  };
}

export function crearCliente(cambios: Partial<Cliente> = {}): Cliente {
  return {
    id: 'cli-1',
    nombre: 'Cliente Norte',
    createdAt: '2026-03-01T08:00:00.000Z',
    ...cambios,
  };
}

export function crearConfiguracion(cambios: Partial<Configuracion> = {}): Configuracion {
  return {
    id: 1,
    valorHoraEstandar: '0.00',
    diasAlertaRiesgo: 3,
    porcentajeAvanceRiesgo: 80,
    etapasDefault: ['Corte', 'Soldadura', 'Mecanizado', 'Pintura', 'Entrega'],
    ...cambios,
  };
}

export interface EstadoFalso {
  ops: OrdenTrabajo[];
  etapas: EtapaOrden[];
  horas: RegistroHora[];
  clientes: Cliente[];
  configuracion: Configuracion | null;
  escrituras: { etapaId: string; completada: boolean }[];
  consultas: string[];
}

export interface OpcionesFalsas {
  readonly ops?: readonly OrdenTrabajo[];
  readonly etapas?: readonly EtapaOrden[];
  readonly horas?: readonly RegistroHora[];
  readonly clientes?: readonly Cliente[];
  readonly configuracion?: Configuracion | null;
  readonly instante?: Date;
  readonly zonaHoraria?: string;
}

export function crearDependenciasFalsas(opciones: OpcionesFalsas = {}): {
  dependencias: DependenciasApi;
  estado: EstadoFalso;
} {
  const estado: EstadoFalso = {
    ops: [...(opciones.ops ?? [crearOrden()])],
    etapas: [...(opciones.etapas ?? crearEtapas(['Corte', 'Soldadura', 'Mecanizado']))],
    horas: [...(opciones.horas ?? [])],
    clientes: [...(opciones.clientes ?? [crearCliente()])],
    configuracion: opciones.configuracion === undefined ? crearConfiguracion() : opciones.configuracion,
    escrituras: [],
    consultas: [],
  };
  const grafico = estado;

  const dependencias: DependenciasApi = {
    ops: {
      crear: async (datos) => {
        const orden = crearOrden({ ...datos, id: `op-${estado.ops.length + 1}` });
        estado.ops.push(orden);
        return orden;
      },
      actualizar: async (id, datos) => {
        const idx = estado.ops.findIndex((o) => o.id === id);
        if (idx < 0) return null;
        const actual = estado.ops[idx]!;
        const actualizado = { ...actual, ...datos };
        estado.ops[idx] = actualizado;
        return actualizado;
      },
      buscarPorId: async (id) => {
        grafico.consultas.push(`op:${id}`);
        return estado.ops.find((orden) => orden.id === id) ?? null;
      },
      buscarPorNumeroOp: async (numeroOp) =>
        estado.ops.find((orden) => orden.numeroOp === numeroOp) ?? null,
      buscarPorCodigoPlano: async (codigo, opIdExcluida) =>
        estado.ops.find(
          (orden) =>
            orden.codigoPlano === codigo && (opIdExcluida === undefined || orden.id !== opIdExcluida),
        ) ?? null,
      listarConEtapas: async () => {
        grafico.consultas.push('ops:listarConEtapas');
        return estado.ops.map((orden) => ({
          orden,
          etapas: estado.etapas
            .filter((etapa) => etapa.ordenId === orden.id)
            .slice()
            .sort((a, b) => a.ordenSecuencia - b.ordenSecuencia),
          clienteNombre: estado.clientes.find((cliente) => cliente.id === orden.clienteId)?.nombre ?? null,
        }));
      },
    },
    etapas: {
      crearVarias: async (ordenId, etapas) => {
        const creadas = etapas.map((etapa, indice) =>
          crearEtapa({
            id: `${ordenId}-nueva-${indice + 1}`,
            ordenId,
            nombre: etapa.nombre,
            ordenSecuencia: etapa.ordenSecuencia,
            horasVendidas: etapa.horasVendidas ?? '0.00',
          }),
        );
        estado.etapas.push(...creadas);
        return creadas;
      },
      listarPorOrden: async (ordenId) =>
        estado.etapas
          .filter((etapa) => etapa.ordenId === ordenId)
          .slice()
          .sort((a, b) => a.ordenSecuencia - b.ordenSecuencia),
      buscarPorId: async (id) => {
        grafico.consultas.push(`etapa:${id}`);
        return estado.etapas.find((etapa) => etapa.id === id) ?? null;
      },
      actualizarCompletada: async (id, completada) => {
        grafico.consultas.push(`update:${id}`);
        grafico.escrituras.push({ etapaId: id, completada });
        const etapa = estado.etapas.find((item) => item.id === id);
        if (!etapa) return null;
        const actualizada: EtapaOrden = { ...etapa, completada };
        estado.etapas = estado.etapas.map((item) => (item.id === id ? actualizada : item));
        return actualizada;
      },
      eliminar: async (id) => {
        estado.etapas = estado.etapas.filter((e) => e.id !== id);
      },
      actualizarSecuencia: async (id, ordenSecuencia) => {
        estado.etapas = estado.etapas.map((e) => (e.id === id ? { ...e, ordenSecuencia } : e));
      },
    },
    clientes: {
      crear: async (datos) => {
        const cliente = crearCliente({ id: `cli-${estado.clientes.length + 1}`, nombre: datos.nombre });
        estado.clientes.push(cliente);
        return cliente;
      },
      buscarPorNombre: async (nombre) => estado.clientes.find((cliente) => cliente.nombre === nombre) ?? null,
      buscarPorId: async (id) => estado.clientes.find((cliente) => cliente.id === id) ?? null,
    },
    materiales: {
      crearVarios: async () => [],
      listarPorOrden: async () => [],
    },
    horas: {
      crear: async (datos: NuevoRegistroHora): Promise<RegistroHora> => {
        const creado = crearRegistroHora({ ...datos, id: `hora-${estado.horas.length + 1}`, etapaId: datos.etapaId ?? null });
        estado.horas.push(creado);
        return creado;
      },
      listarPorOrden: async (ordenId) =>
        estado.horas
          .filter((hora) => hora.ordenId === ordenId)
          .slice()
          .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.createdAt.localeCompare(b.createdAt)),
      listarPorOrdenes: async (ordenIds) => {
        const ids = new Set(ordenIds);
        return estado.horas
          .filter((hora) => ids.has(hora.ordenId))
          .slice()
          .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.createdAt.localeCompare(b.createdAt));
      },
      buscarPorId: async (id) => estado.horas.find((hora) => hora.id === id) ?? null,
      actualizar: async () => null,
      eliminar: async () => false,
    },
    configuracion: {
      obtener: async () => estado.configuracion,
    },
    unidadTrabajoOps: {
      ejecutar: async <T>(
        operacion: (repos: {
          ops: DependenciasApi['ops'];
          etapas: DependenciasApi['etapas'];
          clientes: DependenciasApi['clientes'];
          materiales: { crearVarios: (ordenId: string, materiales: readonly import('@velco/domain').NuevoMaterialOrden[]) => Promise<readonly import('@velco/domain').MaterialOrden[]>; listarPorOrden: (ordenId: string) => Promise<readonly import('@velco/domain').MaterialOrden[]> };
        }) => Promise<T>,
      ) =>
        operacion({
          ops: dependencias.ops,
          etapas: dependencias.etapas,
          clientes: dependencias.clientes,
          materiales: { crearVarios: async () => [], listarPorOrden: async () => [] },
        }),
    },
    unidadTrabajoHoras: {
      ejecutar: async <T>(operacion: (repos: { horas: DependenciasApi['horas']; ops: DependenciasApi['ops']; etapas: DependenciasApi['etapas'] }) => Promise<T>) =>
        operacion({ horas: dependencias.horas, ops: dependencias.ops, etapas: dependencias.etapas }),
    },
    reloj: {
      ahora: () => opciones.instante ?? INSTANTE_FIJO,
    },
    zonaHoraria: opciones.zonaHoraria ?? ZONA_PRUEBA,
  };

  return { dependencias, estado };
}
