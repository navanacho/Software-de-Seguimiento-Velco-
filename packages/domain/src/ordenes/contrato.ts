export interface OrdenTrabajo {
  readonly id: string;
  readonly numeroOp: string;
  readonly codigoPlano: string | null;
  readonly clienteId: string;
  readonly descripcionPieza: string;
  readonly fechaIngreso: string;
  readonly fechaEntrega: string;
  readonly montoVendido: string;
  readonly observaciones: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface NuevaOrdenTrabajo {
  readonly numeroOp: string;
  readonly codigoPlano?: string | null;
  readonly clienteId: string;
  readonly descripcionPieza: string;
  readonly fechaEntrega: string;
  readonly montoVendido: string;
  readonly observaciones?: string | null;
}
