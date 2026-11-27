import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import {
  absPathHistorico,
  evidenciaEnlace,
  piezasEnlaces,
} from '../../src/features/exportacion/excel/enlaces';
import { descriptorPlantilla } from '../../src/features/exportacion/excel/inventario';
import type { MapaSemanticoPlanilla } from '../../src/features/exportacion/excel/mapeo';
import { celdaUnica } from '../../src/features/exportacion/excel/xml';
import { leerZip, escribirZip } from '../../src/features/exportacion/excel/zip';
import {
  exigirGateConforme,
  generarCosteo,
  valoresCosteo,
  verificarCosteo,
} from '../../src/features/exportacion/excel/costeo';
import {
  leerPlantilla,
  mapaCosteoC14,
  mutarPieza,
  piezaConContenido,
} from '../excel-template-spike/soporte';

const PIEZA_HOJA_1 = 'xl/worksheets/sheet2.xml';

function salidaConCeldaNoDeclarada(salida: Buffer): Buffer {
  const piezas = leerZip(salida);
  const hoja = piezas.find((pieza) => pieza.nombre === PIEZA_HOJA_1);
  expect(hoja).toBeDefined();
  const xml = hoja?.datos.toString('utf8') ?? '';
  const s39 = celdaUnica(xml, 'S39');
  return escribirZip(
    piezaConContenido(piezas, PIEZA_HOJA_1, xml.replace(s39, s39.replace('<v>0</v>', '<v>1</v>'))),
  );
}

describe('generación del costeo sobre una copia temporal', () => {
  it('3.4 falla antes de devolver Buffer si una celda gobernada no tiene la estructura esperada', () => {
    const original = leerPlantilla('MASTER COSTEO NUEVO.xlsx');
    const piezas = leerZip(original);
    const hoja = piezas.find((pieza) => pieza.nombre === PIEZA_HOJA_1);
    expect(hoja).toBeDefined();
    const xml = hoja?.datos.toString('utf8') ?? '';
    const c7 = celdaUnica(xml, 'C7');
    const malformada = piezaConContenido(
      piezas,
      PIEZA_HOJA_1,
      xml.replace(c7, '<c r="C7" s="31"><f>+[1]GENERAL!D4</f></c>'),
    );

    expect(() => generarCosteo(escribirZip(malformada), mapaCosteoC14())).toThrow(
      /estructura|CELDA| celda /i,
    );
  });

  it('3.4 rechaza la ausencia de una celda gobernada antes de devolver Buffer', () => {
    const original = leerPlantilla('MASTER COSTEO NUEVO.xlsx');
    const piezas = leerZip(original);
    const hoja = piezas.find((pieza) => pieza.nombre === PIEZA_HOJA_1);
    expect(hoja).toBeDefined();
    const xml = hoja?.datos.toString('utf8') ?? '';
    const sinP40 = piezaConContenido(piezas, PIEZA_HOJA_1, xml.replace(/<c r="P40" s="85"\/>/, ''));

    expect(() => generarCosteo(escribirZip(sinP40), mapaCosteoC14())).toThrow(/P40|celda/i);
  });

  it('3.6 TRIANGULATE cubre el primer y el último bloque de materiales', () => {
    const mapa = mapaCosteoC14();
    mapa['materiales.0.descripcion'] = '[MP] Primer bloque';
    mapa['materiales.0.costoUnitario'] = '11.11';
    mapa['materiales.18.descripcion'] = '[INSUMOS] Último bloque';
    mapa['materiales.18.costoUnitario'] = '99.99';

    const valores = valoresCosteo(mapa);
    expect(valores['materiales.0.descripcion']).toBe('[MP] Primer bloque');
    expect(valores['materiales.0.costoUnitario']).toBe('11.11');
    expect(valores['materiales.18.descripcion']).toBe('[INSUMOS] Último bloque');
    expect(valores['materiales.18.costoUnitario']).toBe('99.99');
    expect(Object.keys(valores)).toHaveLength(4 + 19 * 5 + 1);
  });

  it('3.6 TRIANGULATE con OP vacía mantiene las claves y no agrega bloques', () => {
    const vacio: MapaSemanticoPlanilla = Object.fromEntries(
      descriptorPlantilla('costeo-c14').celdas.map((celda) => [celda.clave, '']),
    );
    const valores = valoresCosteo(vacio);
    const historicas = new Set(descriptorPlantilla('costeo').celdas.map((celda) => celda.clave));
    const novedades = Object.keys(valores).filter((clave) => !historicas.has(clave));

    expect(Object.values(valores).every((valor) => valor === '')).toBe(true);
    expect(novedades).toHaveLength(4 + 19 * 5 + 1);
    expect(
      novedades.every(
        (clave) =>
          clave === 'cliente' ||
          clave === 'numeroOp' ||
          clave === 'horasReales' ||
          clave === 'valorHora' ||
          clave === 'costos.costoMaterialesReal' ||
          clave.startsWith('materiales.'),
      ),
    ).toBe(true);
    expect(() => generarCosteo(leerPlantilla('MASTER COSTEO NUEVO.xlsx'), vacio)).not.toThrow();
  });

  it('3.6 TRIANGULATE neutraliza la fórmula compartida de R58', () => {
    const salida = generarCosteo(leerPlantilla('MASTER COSTEO NUEVO.xlsx'), mapaCosteoC14());
    const xml = leerZip(salida).find((pieza) => pieza.nombre === PIEZA_HOJA_1)?.datos.toString('utf8') ?? '';
    const r58 = celdaUnica(xml, 'R58');

    expect(r58).not.toMatch(/<f/);
    expect(r58).toContain('<v>50.00</v>');
  });

  it('3.7 compararConDiffControlado marca como no autorizada una celda fuera del inventario', () => {
    const original = leerPlantilla('MASTER COSTEO NUEVO.xlsx');
    const salida = generarCosteo(original, mapaCosteoC14());
    const conforme = verificarCosteo(original, salida);

    expect(conforme.conforme).toBe(true);
    expect(conforme.diferenciasNoAutorizadas).toHaveLength(0);

    const informe = verificarCosteo(original, salidaConCeldaNoDeclarada(salida));

    expect(informe.conforme).toBe(false);
    expect(informe.diferenciasNoAutorizadas.some((diferencia) => diferencia.celda === 'S39')).toBe(true);
  });

  it('3.8 exigirGateConforme bloquea la salida cuando el gate no es conforme', () => {
    const original = leerPlantilla('MASTER COSTEO NUEVO.xlsx');
    const salida = generarCosteo(original, mapaCosteoC14());

    expect(() => exigirGateConforme(verificarCosteo(original, salida))).not.toThrow();
    expect(() =>
      exigirGateConforme(verificarCosteo(original, salidaConCeldaNoDeclarada(salida))),
    ).toThrow(/gate|conforme/i);
  });

  it('3.8 neutraliza las referencias [1] de la hoja 1 y conserva enlaces y absPath', () => {
    const original = leerPlantilla('MASTER COSTEO NUEVO.xlsx');
    const salida = generarCosteo(original, mapaCosteoC14());
    const hojaOriginal = leerZip(original).find((pieza) => pieza.nombre === PIEZA_HOJA_1);
    const hojaSalida = leerZip(salida).find((pieza) => pieza.nombre === PIEZA_HOJA_1);
    expect(hojaOriginal).toBeDefined();
    expect(hojaSalida).toBeDefined();

    expect((hojaOriginal?.datos.toString('utf8').match(/\[1\]/g) ?? []).length).toBe(2);
    expect((hojaSalida?.datos.toString('utf8').match(/\[1\]/g) ?? []).length).toBe(0);
    expect(piezasEnlaces(salida)).toEqual(piezasEnlaces(original));
    expect(evidenciaEnlace(salida)).toEqual(evidenciaEnlace(original));
    expect(absPathHistorico(salida)).toBe(absPathHistorico(original));
  });

  it('3.8 verifica el contenido con exceljs en modo solo lectura', async () => {
    const salida = generarCosteo(
      leerPlantilla('MASTER COSTEO NUEVO.xlsx'),
      mapaCosteoC14(),
    );
    const libro = new ExcelJS.Workbook();
    await libro.xlsx.load(salida as unknown as Parameters<typeof libro.xlsx.load>[0]);
    const hoja = libro.getWorksheet('1') ?? libro.worksheets[1];
    expect(hoja).toBeDefined();

    expect(hoja?.getCell('C7').value).toBe('OP-2026-001');
    expect(Number(hoja?.getCell('O40').value)).toBe(2);
    expect(hoja?.getCell('P40').value).toBe('kg');
    expect(Number(hoja?.getCell('Q40').value)).toBe(50);
  });

  it.each([
    { nombre: 'xl/externalLinks/externalLink1.xml', etiqueta: 'enlace externo' },
    { nombre: 'xl/calcChain.xml', etiqueta: 'calcChain' },
    { nombre: 'xl/printerSettings/printerSettings1.bin', etiqueta: 'printerSettings' },
    { nombre: 'xl/media/image1.png', etiqueta: 'logo' },
    { nombre: 'xl/workbook.xml', etiqueta: '_xlnm.Print_Area' },
    { nombre: 'xl/worksheets/sheet1.xml', etiqueta: 'GENERAL' },
    { nombre: 'xl/worksheets/sheet3.xml', etiqueta: 'hoja 2' },
    { nombre: 'xl/worksheets/sheet4.xml', etiqueta: 'hoja 3' },
    { nombre: 'xl/worksheets/sheet5.xml', etiqueta: 'hoja 4' },
    { nombre: 'xl/worksheets/sheet6.xml', etiqueta: 'hoja 5' },
  ])('3.9 rechaza la mutación de $etiqueta', ({ nombre }) => {
    const original = leerPlantilla('MASTER COSTEO NUEVO.xlsx');
    const salida = generarCosteo(original, mapaCosteoC14());
    const mutada = mutarPieza(salida, nombre, (datos) => {
      if (nombre === 'xl/workbook.xml') {
        return Buffer.from(
          datos
            .toString('utf8')
            .replace(
              '</workbook>',
              `<definedNames><definedName name="_xlnm.Print_Area">'1'!$A:$S</definedName></definedNames></workbook>`,
            ),
        );
      }
      datos[datos.length - 1] = (datos[datos.length - 1] ?? 0) ^ 1;
      return datos;
    });

    const informe = verificarCosteo(original, mutada);
    expect(informe.conforme).toBe(false);
    expect(() => exigirGateConforme(informe)).toThrow(/gate de costeo no conforme/i);
  });
});
