import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { descriptorPlantilla } from '../../src/features/exportacion/excel/inventario';
import { escribirZip, leerZip, type PiezaZip } from '../../src/features/exportacion/excel/zip';

export const NOMBRES_PLANTILLAS = ['MASTER COSTEO NUEVO.xlsx', 'A - OP-MASTER.xlsx'] as const;

export type NombrePlantilla = (typeof NOMBRES_PLANTILLAS)[number];

const raiz = resolve(process.cwd(), '..');

function archivosEn(directorio: string): string[] {
  return readdirSync(directorio, { withFileTypes: true }).flatMap((entrada) => {
    const ruta = join(directorio, entrada.name);
    return entrada.isDirectory() ? archivosEn(ruta) : ruta.endsWith('.ts') ? [ruta] : [];
  });
}

export function listarArchivosSpike(): string[] {
  return [
    ...archivosEn(join(raiz, 'backend', 'test', 'excel-template-spike')),
    ...archivosEn(join(raiz, 'backend', 'src', 'features', 'exportacion', 'excel')),
  ];
}

export function rutaPlantilla(nombre: NombrePlantilla): string {
  return join(raiz, 'Docs', 'FichasExcel', nombre);
}

export function leerPlantilla(nombre: NombrePlantilla): Buffer {
  return readFileSync(rutaPlantilla(nombre));
}

export function valoresCosteo(c6: string, c7: string): Readonly<Record<string, string>> {
  return Object.fromEntries(
    descriptorPlantilla('costeo')
      .celdas.map((celda) => [celda.clave, celda.referencia === 'C6' ? c6 : c7]),
  );
}

export function valoresOP(d10: string, d11: string): Readonly<Record<string, string>> {
  return Object.fromEntries(
    descriptorPlantilla('op')
      .celdas.filter((celda) => celda.tipo !== 'inlineStr')
      .map((celda) => [celda.clave, celda.referencia === 'D10' ? d10 : d11]),
  );
}

export function piezaConContenido(
  piezas: PiezaZip[],
  nombre: string,
  contenido: string,
): PiezaZip[] {
  return piezas.map((pieza) =>
    pieza.nombre === nombre ? { ...pieza, datos: Buffer.from(contenido, 'utf8') } : pieza,
  );
}

export function mutarPieza(
  contenido: Buffer,
  nombre: string,
  cambio: (datos: Buffer) => Buffer,
): Buffer {
  const piezas = leerZip(contenido);
  if (!piezas.some((pieza) => pieza.nombre === nombre)) {
    const plantilla = piezas[0];
    if (plantilla === undefined) {
      throw new Error('el ZIP de la plantilla no tiene piezas');
    }
    return escribirZip([
      ...piezas,
      { nombre, datos: Buffer.from('mutada'), metadatos: { ...plantilla.metadatos } },
    ]);
  }
  return escribirZip(
    piezas.map((pieza) => (pieza.nombre === nombre ? { ...pieza, datos: cambio(pieza.datos) } : pieza)),
  );
}

export function mapaCosteoC14(valores: Readonly<Record<string, string>> = {}): Record<string, string> {
  const fijos: Readonly<Record<string, string>> = {
    cliente: 'ACME S.A.',
    numeroOp: 'OP-2026-001',
    horasReales: '8.00',
    valorHora: '32.83',
  };
  return Object.fromEntries(
    descriptorPlantilla('costeo-c14').celdas.map((celda) => {
      const porDefecto = celda.clave.startsWith('materiales.')
        ? celda.clave.endsWith('.descripcion')
          ? '[MP] Acero'
          : celda.clave.endsWith('.cantidad')
            ? '2.0000'
            : celda.clave.endsWith('.un')
              ? 'kg'
              : '50.00'
        : (fijos[celda.clave] ?? '');
      return [celda.clave, valores[celda.clave] ?? porDefecto];
    }),
  );
}

export function casoDePlantilla(nombre: NombrePlantilla): {
  id: 'costeo' | 'op';
  nombre: NombrePlantilla;
  valores: Readonly<Record<string, string>>;
  plano: string | null;
} {
  return nombre === 'MASTER COSTEO NUEVO.xlsx'
    ? { id: 'costeo', nombre, valores: valoresCosteo('1234.5600', '987.6543'), plano: null }
    : { id: 'op', nombre, valores: valoresOP('VELCO SRL', 'Bomba a embolo J-30 SIAM'), plano: 'PL-2026-045' };
}
