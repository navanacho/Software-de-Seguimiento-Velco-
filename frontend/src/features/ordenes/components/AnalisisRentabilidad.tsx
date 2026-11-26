import type { DetalleOpDTO } from '../../../shared/domain-client/tipos.ts';
import { TablaComparativaEtapas } from './TablaComparativaEtapas.tsx';
import { ResumenCostosMargen } from './ResumenCostosMargen.tsx';
import estilos from './AnalisisRentabilidad.module.css';

interface Props {
  readonly detalle: DetalleOpDTO;
}

export function AnalisisRentabilidad({ detalle }: Props) {
  return (
    <section aria-label="Análisis de Rentabilidad" className={estilos.panel}>
      <h2>Análisis de Rentabilidad</h2>
      <TablaComparativaEtapas filas={detalle.comparativaPorEtapa} />
      <section
        aria-label="Resumen de costos y margen"
        data-testid="resumen-costos-margen-slot"
        className={estilos.resumenSlot}
      >
        <ResumenCostosMargen
          montoVendido={detalle.montoVendido}
          costoMaterialesCotizado={detalle.costoMaterialesCotizado}
          costoMaterialesReal={detalle.costoMaterialesReal}
          margenReal={detalle.margenReal}
          tasaGlobalNoConfigurada={detalle.tasaGlobalNoConfigurada}
        />
      </section>
    </section>
  );
}
