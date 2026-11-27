import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  HOJAS_COSTEO,
  esModeloCompartido,
  formatearCantidad,
  formatearImporte,
  mapearModeloACeldas,
} from '../../src/features/exportacion/excel/index';

describe('refactor de la capa excel de exportacion-costeo', () => {
  it('2.10 expone un único barrel con tipos explícitos', () => {
    expect(typeof mapearModeloACeldas).toBe('function');
    expect(typeof esModeloCompartido).toBe('function');
    expect(typeof formatearImporte).toBe('function');
    expect(typeof formatearCantidad).toBe('function');
    expect(HOJAS_COSTEO).toEqual(['1', '2', '3', '4', '5']);
  });

  it('2.10 reutiliza el descriptor de C-13 y no duplica ZIP, hash ni patcher', () => {
    const raiz = resolve(process.cwd(), '..');
    const ruta = join(raiz, 'backend', 'src', 'features', 'exportacion', 'excel', 'mapeo.ts');
    const fuente = readFileSync(ruta, 'utf8');
    expect(fuente).toContain("descriptorPlantilla('costeo')");
    expect(fuente).not.toMatch(/createHash|node:zlib|leerZip|parchearPlantilla/);
    expect(fuente).not.toMatch(/\bany\b/);
  });
});
