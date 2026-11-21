import type { Cliente, Configuracion, EtapaOrden, OrdenTrabajo } from '@velco/domain';
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
    clienteId: 'cli-1',
    descripcionPieza: 'Eje de transmisión',
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
  clientes: Cliente[];
  configuracion: Configuracion | null;
  escrituras: { etapaId: string; completada: boolean }[];
  consultas: string[];
}

export interface OpcionesFalsas {
  readonly ops?: readonly OrdenTrabajo[];
  readonly etapas?: readonly EtapaOrden[];
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
      buscarPorId: async (id) => {
        grafico.consultas.push(`op:${id}`);
        return estado.ops.find((orden) => orden.id === id) ?? null;
      },
      buscarPorNumeroOp: async (numeroOp) =>
        estado.ops.find((orden) => orden.numeroOp === numeroOp) ?? null,
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
    configuracion: {
      obtener: async () => estado.configuracion,
    },
    reloj: {
      ahora: () => opciones.instante ?? INSTANTE_FIJO,
    },
    zonaHoraria: opciones.zonaHoraria ?? ZONA_PRUEBA,
  };

  return { dependencias, estado };
}
