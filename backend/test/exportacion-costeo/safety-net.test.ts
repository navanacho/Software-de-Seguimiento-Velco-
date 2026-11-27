import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { NOMBRES_PLANTILLAS, leerPlantilla, type NombrePlantilla } from '../excel-template-spike/soporte';

const HASHES_ESPERADOS: Readonly<Record<NombrePlantilla, string>> = {
  'MASTER COSTEO NUEVO.xlsx': '1fa2da0031d2a06bbac506057f3679d77ca835d1eb70b8657f19d95a47649602',
  'A - OP-MASTER.xlsx': '4154e5baf8fb82b5bfd3fd48ee8c7af8f05f5980e4efa8627cb14562454f015a',
};

function sha256(contenido: Buffer): string {
  return createHash('sha256').update(contenido).digest('hex');
}

describe('C-14 safety net de plantillas oficiales', () => {
  it.each(NOMBRES_PLANTILLAS)('1.1 conserva el hash SHA-256 de %s', (nombre) => {
    const contenido = leerPlantilla(nombre);
    expect(sha256(contenido)).toBe(HASHES_ESPERADOS[nombre]);
    expect(sha256(leerPlantilla(nombre))).toBe(HASHES_ESPERADOS[nombre]);
  });

  it('1.1 reutiliza el inventario de nombres del spike sin duplicarlo', () => {
    expect(NOMBRES_PLANTILLAS).toEqual(['MASTER COSTEO NUEVO.xlsx', 'A - OP-MASTER.xlsx']);
  });
});
