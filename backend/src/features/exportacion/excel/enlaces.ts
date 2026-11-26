import { descriptorPlantilla, type IdPlantilla } from './inventario';
import { celdaUnica } from './xml';
import { hashDatos, leerZip } from './zip';

export const PIEZA_ENLACE = 'xl/externalLinks/externalLink1.xml';
export const PIEZA_RELACIONES_ENLACE = 'xl/externalLinks/_rels/externalLink1.xml.rels';

const piezaLibro = 'xl/workbook.xml';

export function absPathHistorico(contenido: Buffer): string {
  const libro = leerZip(contenido).find((pieza) => pieza.nombre === piezaLibro);
  const absPath = libro?.datos.toString('utf8').match(/<x15ac:absPath\b[^>]*\/>/)?.[0];
  if (absPath === undefined) {
    throw new Error(`la plantilla no conserva x15ac:absPath en ${piezaLibro}`);
  }
  return absPath;
}

export interface EvidenciaEnlace {
  bytes: number;
  target: string;
  pieza: string;
  usadoComoFuente: false;
}

export interface PiezaEnlaceMetadata {
  nombre: string;
  hash: string;
  usadoComoFuente: false;
}

export function piezasEnlaces(contenido: Buffer): PiezaEnlaceMetadata[] {
  return leerZip(contenido)
    .filter((pieza) => pieza.nombre.startsWith('xl/externalLinks/'))
    .map((pieza) => ({ nombre: pieza.nombre, hash: hashDatos(pieza.datos), usadoComoFuente: false }));
}

export interface InventarioReferenciasUno {
  enCeldasMaestras: number;
  fueraDeCeldasMaestras: number;
}

function contarReferenciasUno(texto: string): number {
  return (texto.match(/\[1\]/g) ?? []).length;
}

export function inventarioReferenciasUno(id: IdPlantilla, contenido: Buffer): InventarioReferenciasUno {
  const piezas = leerZip(contenido);
  const total = piezas.reduce(
    (suma, pieza) => suma + contarReferenciasUno(pieza.datos.toString('utf8')),
    0,
  );
  const enCeldasMaestras = descriptorPlantilla(id).celdas
    .filter((celda) => celda.tipo !== 'inlineStr')
    .reduce((suma, celda) => {
      const pieza = piezas.find((entrada) => entrada.nombre === celda.pieza);
      if (pieza === undefined) {
        throw new Error(`falta la pieza ${celda.pieza} para inventariar referencias externas`);
      }
      return suma + contarReferenciasUno(celdaUnica(pieza.datos.toString('utf8'), celda.referencia));
    }, 0);

  return { enCeldasMaestras, fueraDeCeldasMaestras: total - enCeldasMaestras };
}

export function evidenciaEnlace(contenido: Buffer): EvidenciaEnlace {
  const piezas = leerZip(contenido);
  const enlace = piezas.find((pieza) => pieza.nombre === PIEZA_ENLACE);
  const relaciones = piezas.find((pieza) => pieza.nombre === PIEZA_RELACIONES_ENLACE);
  if (enlace === undefined || relaciones === undefined) {
    throw new Error('la plantilla no contiene el enlace externo esperado');
  }
  const target = relaciones.datos.toString('utf8').match(/<Relationship\b[^>]*\bTarget="([^"]+)"/)?.[1];
  if (target === undefined) {
    throw new Error('el enlace externo no declara un Target');
  }
  return { bytes: enlace.datos.length, target, pieza: PIEZA_ENLACE, usadoComoFuente: false };
}
