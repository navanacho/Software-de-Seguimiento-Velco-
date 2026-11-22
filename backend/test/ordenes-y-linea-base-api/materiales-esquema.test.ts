import { describe, expect, it } from 'vitest';
import { BodyAltaMaterialSchema } from '../../src/features/materiales/http/esquemas.ts';

describe('BodyAltaMaterialSchema', () => {
  it('7.1 acepta MP/INSUMOS/TERCERIZADOS y rechaza cantidad <= 0', () => {
    expect(BodyAltaMaterialSchema.safeParse({ tipo: 'MP', descripcion: 'Acero', cantidad: '1.00', costoUnitarioCotizado: '10.00' }).success).toBe(true);
    expect(BodyAltaMaterialSchema.safeParse({ tipo: 'INSUMOS', descripcion: 'Gas', cantidad: '1.00', costoUnitarioCotizado: '10.00' }).success).toBe(true);
    expect(BodyAltaMaterialSchema.safeParse({ tipo: 'OTRO', descripcion: 'X', cantidad: '1.00', costoUnitarioCotizado: '10.00' }).success).toBe(false);
    expect(BodyAltaMaterialSchema.safeParse({ tipo: 'MP', descripcion: 'Acero', cantidad: '0', costoUnitarioCotizado: '10.00' }).success).toBe(false);
  });

  it('7.3 TRIANGULA: costos no negativos y opcionales ausentes', () => {
    expect(BodyAltaMaterialSchema.safeParse({ tipo: 'TERCERIZADOS', descripcion: 'Pintura', cantidad: '2', costoUnitarioCotizado: '0.00' }).success).toBe(true);
    expect(BodyAltaMaterialSchema.safeParse({ tipo: 'MP', descripcion: 'Acero', cantidad: '1', costoUnitarioCotizado: '-1' }).success).toBe(false);
  });
});
