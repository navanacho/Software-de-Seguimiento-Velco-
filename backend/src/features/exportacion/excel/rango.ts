import { descriptorPlantilla } from './inventario';
import { celdaUnica, parchearCeldaPlano, valorPlano } from './xml';
import { escribirZip, leerZip } from './zip';

const piezaCompartidas = 'xl/sharedStrings.xml';

export interface EtiquetasCompartidas {
  idPlano: boolean;
  sp: boolean;
}

export interface EvidenciaRangoPlano {
  fusion: string;
  celdaMaestra: string;
  textoAlternativo: string;
  etiquetasEnCompartidas: EtiquetasCompartidas;
}

function piezaDeTexto(piezas: ReturnType<typeof leerZip>, nombre: string): string {
  const pieza = piezas.find((entrada) => entrada.nombre === nombre);
  if (pieza === undefined) {
    throw new Error(`falta la pieza ${nombre} en la plantilla de OP`);
  }
  return pieza.datos.toString('utf8');
}

function rangoDeOP() {
  const rango = descriptorPlantilla('op').rangoPlano;
  if (rango === undefined) {
    throw new Error('el descriptor de OP no declara el rango del plano');
  }
  return rango;
}

function textoCompartido(xmlHoja: string, xmlCompartidas: string, referencia: string): string {
  const indice = Number(celdaUnica(xmlHoja, referencia).match(/<v>(\d+)<\/v>/)?.[1]);
  const items = xmlCompartidas.match(/<si>[\s\S]*?<\/si>/g) ?? [];
  const item = items[indice];
  if (item === undefined) {
    throw new Error(`no existe la cadena compartida de ${referencia}`);
  }
  return item.match(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/)?.[1] ?? '';
}

export function escribirPlanoEnCelda(contenido: Buffer, plano: string | null): Buffer {
  const rango = rangoDeOP();
  const celda = descriptorPlantilla('op').celdas.find(
    (entrada) => entrada.referencia === rango.celda && entrada.tipo === rango.tipo,
  );
  if (celda === undefined) {
    throw new Error('el descriptor de OP no declara la celda maestra del plano');
  }
  const piezas = leerZip(contenido);
  const xmlPorPieza = new Map<string, string>(
    piezas.map((pieza) => [pieza.nombre, pieza.datos.toString('utf8')]),
  );
  const xml = xmlPorPieza.get(celda.pieza);
  if (xml === undefined) {
    throw new Error(`falta la pieza ${celda.pieza} en la plantilla de OP`);
  }
  xmlPorPieza.set(celda.pieza, parchearCeldaPlano(xml, celda, valorPlano(plano)));

  return escribirZip(
    piezas.map((pieza) => {
      const xmlPieza = xmlPorPieza.get(pieza.nombre);
      return xmlPieza === undefined || xmlPieza === pieza.datos.toString('utf8')
        ? pieza
        : { ...pieza, datos: Buffer.from(xmlPieza, 'utf8') };
    }),
  );
}

export function evidenciaRangoPlano(contenido: Buffer): EvidenciaRangoPlano {
  const rango = rangoDeOP();
  const piezas = leerZip(contenido);
  const entradaHoja = descriptorPlantilla('op').hojas()[0];
  if (entradaHoja === undefined) {
    throw new Error('el descriptor de OP no declara hojas');
  }
  const xmlHoja = piezaDeTexto(piezas, entradaHoja[1]);
  const xmlCompartidas = piezaDeTexto(piezas, piezaCompartidas);

  const fusion = xmlHoja.match(new RegExp(`<mergeCell ref="(${rango.fusion})"\\/>`))?.[1];
  if (fusion === undefined) {
    throw new Error(`la plantilla no conserva el merge ${rango.fusion}`);
  }
  const referenciaAlternativa = rango.alternativa.rango.split(':')[0] ?? '';

  return {
    fusion,
    celdaMaestra: celdaUnica(xmlHoja, rango.celda),
    textoAlternativo: textoCompartido(xmlHoja, xmlCompartidas, referenciaAlternativa),
    etiquetasEnCompartidas: {
      idPlano: xmlCompartidas.includes('ID Plano:'),
      sp: xmlCompartidas.includes('S/P'),
    },
  };
}
