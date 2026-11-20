import clsx from 'clsx';
import { RUTA_SALUD } from '@velco/domain';
import type { RespuestaSalud } from '@velco/domain';
import estilos from './Salud.module.css';

interface PropiedadesSalud {
  respuesta: RespuestaSalud;
}

export function Salud({ respuesta }: PropiedadesSalud) {
  const clases = clsx(estilos.tarjeta, respuesta.estado === 'ok' && estilos.operativa);

  return (
    <section className={clases} data-ruta={RUTA_SALUD}>
      <h1>Seguimiento de producción</h1>
      <p>Estado: {respuesta.estado}</p>
    </section>
  );
}
