import type { ActualizarOpEntrada, CrearOpEntrada } from '../../shared/domain-client/esquemas.ts';
import type { ValoresFormulario } from './tiposFormulario.ts';

export function aCrearOp(valores: ValoresFormulario): CrearOpEntrada {
  return {
    numeroOp: valores.numeroOp,
    codigoPlano: valores.codigoPlano,
    clienteNombre: valores.clienteNombre,
    descripcionPieza: valores.descripcionPieza,
    fechaEntrega: valores.fechaEntrega,
    montoVendido: valores.montoVendido,
    observaciones: valores.observaciones,
    materiales: valores.materiales.map((material) => ({
      tipo: material.tipo,
      descripcion: material.descripcion,
      cantidad: material.cantidad,
      unidad: material.unidad,
      costoUnitarioCotizado: material.costoUnitarioCotizado,
    })),
    ...(valores.etapasModificadas
      ? {
          etapas: valores.etapas.map((etapa) => ({
            nombre: etapa.nombre,
            horasVendidas: etapa.horasVendidas,
          })),
        }
      : {}),
  };
}

export function aActualizarOp(valores: ValoresFormulario): ActualizarOpEntrada {
  return {
    numeroOp: valores.numeroOp,
    codigoPlano: valores.codigoPlano,
    clienteNombre: valores.clienteNombre,
    descripcionPieza: valores.descripcionPieza,
    fechaEntrega: valores.fechaEntrega,
    montoVendido: valores.montoVendido,
    observaciones: valores.observaciones,
  };
}
