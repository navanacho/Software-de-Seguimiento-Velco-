import type { EtapaOrden } from '@velco/domain';
import type { EtapaOrden as EtapaOrdenPrisma } from '@prisma/client';

export function aEtapaOrden(fila: EtapaOrdenPrisma): EtapaOrden {
  return {
    id: fila.id,
    ordenId: fila.ordenId,
    nombre: fila.nombre,
    ordenSecuencia: fila.ordenSecuencia,
    completada: fila.completada,
    horasVendidas: fila.horasVendidas.toFixed(2),
  };
}
