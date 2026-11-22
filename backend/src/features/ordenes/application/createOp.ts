import type { Cliente, EtapaOrden, NuevaEtapa, NuevoMaterialOrden, OrdenTrabajo } from '@velco/domain';
import { nombreEtapaDuplicado, normalizarCodigoPlano, validarNuevoMaterial } from '@velco/domain';
import type { DependenciasApi } from '../../../shared/dependencias.ts';
import { CodigoPlanoDuplicadoError, NumeroOpDuplicadoError } from '../../../shared/errores.ts';

export interface ComandoCrearOp {
  readonly numeroOp: string;
  readonly codigoPlano?: string | null;
  readonly clienteNombre: string;
  readonly descripcionPieza: string;
  readonly fechaEntrega: string;
  readonly montoVendido: string;
  readonly observaciones?: string | null;
  readonly materiales: readonly unknown[];
  readonly etapas?: readonly { nombre: string; horasVendidas?: string }[];
}

export interface ResultadoCrearOp {
  readonly op: OrdenTrabajo;
  readonly cliente: Cliente;
  readonly etapas: readonly EtapaOrden[];
}

export async function createOp(deps: DependenciasApi, comando: ComandoCrearOp): Promise<ResultadoCrearOp> {
  const clienteNombre = comando.clienteNombre.trim();
  if (clienteNombre.length === 0) throw new Error('validation_error:clienteNombre');
  const codigoPlano = normalizarCodigoPlano(comando.codigoPlano);

  if (codigoPlano !== null) {
    const existente = await deps.ops.buscarPorCodigoPlano(codigoPlano);
    if (existente) throw new CodigoPlanoDuplicadoError(codigoPlano, { id: existente.id, numeroOp: existente.numeroOp });
  }
  const existenteNum = await deps.ops.buscarPorNumeroOp(comando.numeroOp);
  if (existenteNum) throw new NumeroOpDuplicadoError(comando.numeroOp);

  const configuracion = await deps.configuracion.obtener();
  const nombresEtapas = (comando.etapas?.map((e) => e.nombre) ?? configuracion?.etapasDefault ?? []).map((n) => n.trim());
  const vistos: string[] = [];
  for (const nombre of nombresEtapas) {
    if (nombre.length === 0) throw new Error('validation_error:etapaNombre');
    if (nombreEtapaDuplicado(vistos, nombre)) throw new Error(`validation_error:etapaDuplicada:${nombre}`);
    vistos.push(nombre);
  }
  const materiales: NuevoMaterialOrden[] = comando.materiales.map(validarNuevoMaterial);

  return deps.unidadTrabajoOps.ejecutar(async (repos) => {
    let cliente = await repos.clientes.buscarPorNombre(clienteNombre);
    if (!cliente) cliente = await repos.clientes.crear({ nombre: clienteNombre });

    const op = await repos.ops.crear({
      numeroOp: comando.numeroOp,
      codigoPlano,
      clienteId: cliente.id,
      descripcionPieza: comando.descripcionPieza,
      fechaEntrega: comando.fechaEntrega,
      montoVendido: comando.montoVendido,
      observaciones: comando.observaciones ?? null,
    });

    const nuevasEtapas: NuevaEtapa[] = nombresEtapas.map((nombre, indice) => ({
      nombre,
      ordenSecuencia: indice + 1,
      horasVendidas: comando.etapas?.[indice]?.horasVendidas ?? '0.00',
    }));
    const etapas = await repos.etapas.crearVarias(op.id, nuevasEtapas);
    if (materiales.length > 0) await repos.materiales.crearVarios(op.id, materiales);

    return { op, cliente, etapas };
  });
}
