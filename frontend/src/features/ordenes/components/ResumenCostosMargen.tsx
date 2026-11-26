import type { DetalleOpDTO } from '../../../shared/domain-client/tipos.ts';
import { formatearImporte } from '../../../shared/domain-client/formatoDecimal.ts';
import estilos from './ResumenCostosMargen.module.css';

type Props = Pick<
  DetalleOpDTO,
  'montoVendido' | 'costoMaterialesCotizado' | 'costoMaterialesReal' | 'margenReal' | 'tasaGlobalNoConfigurada'
>;

export function ResumenCostosMargen({
  montoVendido,
  costoMaterialesCotizado,
  costoMaterialesReal,
  margenReal,
  tasaGlobalNoConfigurada,
}: Props) {
  return (
    <div className={estilos.resumen}>
      <dl className={estilos.lista}>
        <div className={estilos.fila}>
          <dt>Monto vendido</dt>
          <dd>{formatearImporte(montoVendido)}</dd>
        </div>
        <div className={estilos.fila}>
          <dt>Costo de materiales cotizado</dt>
          <dd>{formatearImporte(costoMaterialesCotizado)}</dd>
        </div>
        <div className={estilos.fila}>
          <dt>Costo de materiales real</dt>
          <dd>{formatearImporte(costoMaterialesReal)}</dd>
        </div>
        <div className={estilos.fila}>
          <dt>Margen real</dt>
          <dd>{formatearImporte(margenReal)}</dd>
        </div>
      </dl>
      {tasaGlobalNoConfigurada ? (
        <p role="status" className={estilos.advertencia}>
          El valor hora estándar está en 0.00 y debe configurarse.
        </p>
      ) : null}
    </div>
  );
}
