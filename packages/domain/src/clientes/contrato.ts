export interface Cliente {
  readonly id: string;
  readonly nombre: string;
  readonly createdAt: string;
}

export interface NuevoCliente {
  readonly nombre: string;
}
