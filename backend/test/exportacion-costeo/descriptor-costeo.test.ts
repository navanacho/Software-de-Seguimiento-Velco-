import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  descriptorPlantilla,
  FILAS_MATERIALES_COSTEO,
  type IdPlantilla,
} from '../../src/features/exportacion/excel/inventario';
import { celdaUnica } from '../../src/features/exportacion/excel/xml';
import { leerZip } from '../../src/features/exportacion/excel/zip';
import { leerPlantilla } from '../excel-template-spike/soporte';

const PIEZA_HOJA_1 = 'xl/worksheets/sheet2.xml';

describe('descriptor de costeo C-14 limitado a la hoja 1', () => {
  it('3.1 declara las celdas maestras y las celdas adicionales confirmadas en Q2', () => {
    const descriptor = descriptorPlantilla('costeo-c14' as IdPlantilla);
    const claves = new Set(descriptor.celdas.map((celda) => celda.clave));
    const referencias = new Set(descriptor.celdas.map((celda) => celda.referencia));

    expect(descriptor.archivo).toBe('MASTER COSTEO NUEVO.xlsx');
    expect(descriptor.celdas).toHaveLength(2 + 2 + 9 + 19 * 5 + 1);
    expect(descriptor.celdas.every((celda) => celda.pieza === PIEZA_HOJA_1 && celda.hoja === '1')).toBe(true);
    for (const clave of [
      'cliente',
      'numeroOp',
      'horasReales',
      'valorHora',
      'materiales.0.descripcion',
      'materiales.0.cantidad',
      'materiales.0.un',
      'materiales.0.costoUnitario',
      'materiales.0.costoTotal',
      'costos.costoMaterialesReal',
    ]) {
      expect(claves.has(clave), clave).toBe(true);
    }
    for (const referencia of [
      'C6', 'C7', 'P13', 'R10',
      'Q13', 'Q14', 'Q21',
      'C40', 'O40', 'P40', 'Q40', 'R40', 'R41', 'R58', 'R59',
    ]) {
      expect(referencias.has(referencia), referencia).toBe(true);
    }
  });

  it('3.1 conserva el descriptor histórico de C-13 con sus diez celdas maestras', () => {
    const historico = descriptorPlantilla('costeo');

    expect(historico.celdas).toHaveLength(10);
    expect(historico.piezasAutorizadas()).toHaveLength(5);
    expect(historico.celdas.every((celda) => celda.referencia === 'C6' || celda.referencia === 'C7')).toBe(true);
  });

  it('3.3 TRIANGULATE con todos los bloques: diecinueve filas y ninguna pieza ajena autorizada', () => {
    const original = leerPlantilla('MASTER COSTEO NUEVO.xlsx');
    const hashAntes = createHash('sha256').update(original).digest('hex');
    const descriptor = descriptorPlantilla('costeo-c14');
    const materiales = descriptor.celdas.filter((celda) => celda.clave.startsWith('materiales.'));

    expect(FILAS_MATERIALES_COSTEO).toBe(19);
    expect(materiales).toHaveLength(19 * 5);
    for (let indice = 0; indice < FILAS_MATERIALES_COSTEO; indice += 1) {
      const fila = 40 + indice;
      for (const columna of ['C', 'O', 'P', 'Q', 'R']) {
        expect(materiales.some((celda) => celda.referencia === `${columna}${fila}`)).toBe(true);
      }
    }
    expect(descriptor.piezasAutorizadas()).toEqual([PIEZA_HOJA_1]);
    expect(descriptor.piezasAutorizadas()).not.toContain('xl/worksheets/sheet1.xml');
    for (const pieza of ['sheet3.xml', 'sheet4.xml', 'sheet5.xml', 'sheet6.xml']) {
      expect(descriptor.piezasAutorizadas()).not.toContain(`xl/worksheets/${pieza}`);
    }
    expect(createHash('sha256').update(leerPlantilla('MASTER COSTEO NUEVO.xlsx')).digest('hex')).toBe(hashAntes);
  });

  it('3.3 TRIANGULATE con OP vacía: el descriptor es puro y cada celda declarada existe en la hoja 1', () => {
    const descriptor = descriptorPlantilla('costeo-c14');
    const xml = leerZip(leerPlantilla('MASTER COSTEO NUEVO.xlsx')).find(
      (pieza) => pieza.nombre === PIEZA_HOJA_1,
    )?.datos.toString('utf8');
    expect(xml).toBeDefined();
    expect(descriptorPlantilla('costeo-c14')).toEqual(descriptor);

    for (const celda of descriptor.celdas) {
      expect(() => celdaUnica(xml ?? '', celda.referencia), celda.referencia).not.toThrow();
    }
    expect(descriptor.celdas.every((celda) => /^[A-Z]+\d+$/.test(celda.referencia))).toBe(true);
  });
});
