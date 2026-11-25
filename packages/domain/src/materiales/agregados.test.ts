import { describe, expect, it } from 'vitest';
import { calcularAgregadosMateriales } from './agregados.ts';

describe('calcularAgregadosMateriales', () => {
  it('7.4 suma cotizado y real con COALESCE por ítem', () => {
    const r = calcularAgregadosMateriales([
      { cantidad: '2.00', costoUnitarioCotizado: '10.00', costoUnitarioReal: '12.00' },
      { cantidad: '1.50', costoUnitarioCotizado: '4.00', costoUnitarioReal: null },
    ]);
    expect(r).toEqual({ costoMaterialesCotizado: '26.00', costoMaterialesReal: '30.00' });
  });

  it('C-11 delega el agregado a la regla exacta de margen sin truncar escala 4', () => {
    const r = calcularAgregadosMateriales([
      { cantidad: '1.2345', costoUnitarioCotizado: '10.00', costoUnitarioReal: null },
    ]);
    expect(r).toEqual({ costoMaterialesCotizado: '12.3450', costoMaterialesReal: '12.3450' });
  });

  it('7.6 TRIANGULA: todos null usan cotizado; vacío da cero decimal', () => {
    expect(calcularAgregadosMateriales([
      { cantidad: '1.00', costoUnitarioCotizado: '5.50', costoUnitarioReal: null },
    ])).toEqual({ costoMaterialesCotizado: '5.50', costoMaterialesReal: '5.50' });
    expect(calcularAgregadosMateriales([])).toEqual({ costoMaterialesCotizado: '0.00', costoMaterialesReal: '0.00' });
  });
});
