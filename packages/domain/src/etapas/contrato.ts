export interface EtapaOrden {
  readonly id: string;
  readonly ordenId: string;
  readonly nombre: string;
  readonly ordenSecuencia: number;
  readonly completada: boolean;
  readonly horasVendidas: string;
}

export interface NuevaEtapa {
  readonly nombre: string;
  readonly ordenSecuencia: number;
  readonly horasVendidas?: string;
}
