import { describe, expect, it } from 'vitest';
import {
  absPathHistorico,
  evidenciaEnlace,
  inventarioReferenciasUno,
  piezasEnlaces,
} from '../../src/features/exportacion/excel/enlaces';
import type { IdPlantilla } from '../../src/features/exportacion/excel/inventario';
import { parchearPlantilla } from '../../src/features/exportacion/excel/patcher';
import { casoDePlantilla, leerPlantilla, NOMBRES_PLANTILLAS } from './soporte';

describe('evidencia de enlaces externos OOXML', () => {
  it.each([
    {
      archivo: 'A - OP-MASTER.xlsx',
      bytes: 577125,
      target: '/COMERCIAL/FG48%20-%20FACTURACION%20REGISTRO.xlsx',
    },
    {
      archivo: 'MASTER COSTEO NUEVO.xlsx',
      bytes: 994,
      target: String.raw`file:///K:\COMERCIAL\COSTEO%20-%20GENERAL%20CLIENTE\MASTER%20DE%20COTIZACION%20X%20CLIENTE\COSTEO%20MASTER%20-%20PETROLERA%20EL%20TREBOL%20-%20MENDOZA.xlsx`,
    },
  ] as const)('4.1 registra los bytes y el Target reales de $archivo', ({ archivo, bytes, target }) => {
    const evidencia = evidenciaEnlace(leerPlantilla(archivo));

    expect(evidencia.bytes).toBe(bytes);
    expect(evidencia.target).toBe(target);
    expect(evidencia.usadoComoFuente).toBe(false);
  });

  it.each(NOMBRES_PLANTILLAS)('4.2 conserva externalLinks byte-a-byte como metadata en %s', (nombre) => {
    const caso = casoDePlantilla(nombre);
    const original = leerPlantilla(nombre);
    const salida = parchearPlantilla(caso.id, original, caso.valores, caso.plano);

    const enlacesOriginales = piezasEnlaces(original);
    expect(enlacesOriginales.length).toBeGreaterThan(0);
    expect(enlacesOriginales.every((pieza) => pieza.usadoComoFuente === false)).toBe(true);
    expect(piezasEnlaces(salida)).toEqual(enlacesOriginales);
  });

  it.each([
    { id: 'costeo' as const, nombre: 'MASTER COSTEO NUEVO.xlsx' as const, antes: 10 },
    { id: 'op' as const, nombre: 'A - OP-MASTER.xlsx' as const, antes: 2 },
  ])('4.3 neutraliza las referencias [1] en $nombre sin crear nuevas fuera de ellas', ({ id, nombre, antes }) => {
    const caso = casoDePlantilla(nombre);
    const original = leerPlantilla(nombre);
    const salida = parchearPlantilla(caso.id, original, caso.valores, caso.plano);

    expect(inventarioReferenciasUno(id as IdPlantilla, original)).toEqual({
      enCeldasMaestras: antes,
      fueraDeCeldasMaestras: 0,
    });
    expect(inventarioReferenciasUno(id as IdPlantilla, salida)).toEqual({
      enCeldasMaestras: 0,
      fueraDeCeldasMaestras: 0,
    });
  });

  it.each(NOMBRES_PLANTILLAS)('4.5 conserva x15ac:absPath byte-a-byte en %s sin usarlo como fuente', (nombre) => {
    const caso = casoDePlantilla(nombre);
    const original = leerPlantilla(nombre);
    const salida = parchearPlantilla(caso.id, original, caso.valores, caso.plano);

    const absPathOriginal = absPathHistorico(original);
    expect(absPathOriginal).toMatch(/^<x15ac:absPath\b/);
    expect(absPathOriginal.length).toBeGreaterThan(0);
    expect(absPathHistorico(salida)).toBe(absPathOriginal);
    expect(piezasEnlaces(salida)).toEqual(piezasEnlaces(original));
  });
});
