import {
  descriptorPlantilla,
  type IdPlantilla,
} from './inventario';
import {
  compartidosDeXml,
  mapaCeldas,
  textoDeRango,
} from './xml';
import { hashDatos, leerZip, type PiezaZip } from './zip';

const piezaAreaImpresion = 'xl/workbook.xml';
const piezaImpresion = 'xl/printerSettings/printerSettings1.bin';
const areaImpresionEsperada = "'1640'!$A:$S";

export interface InformeGate {
  conforme: boolean;
  piezasAutorizadas: string[];
  piezasNoAutorizadas: string[];
  faltantes: string[];
  nuevas: string[];
  motivos: string[];
}

export interface DiferenciaCelda {
  hoja: string;
  celda: string;
  valorEsperado: string;
  valorObtenido: string;
}

export interface InformeGateControlado extends InformeGate {
  piezasComparadas: number;
  diferencias: DiferenciaCelda[];
  diferenciasNoAutorizadas: DiferenciaCelda[];
}

export interface InformeTextoPlano {
  conforme: boolean;
  esperado: string;
  obtenido: string;
  alternativaIntacta: boolean;
  alternativaOriginal: string;
  alternativaObtenida: string;
}

function areaDeImpresion(piezas: PiezaZip[]): string | null {
  const libro = piezas.find((pieza) => pieza.nombre === piezaAreaImpresion);
  if (libro === undefined) {
    return null;
  }
  const patron = /<definedName\s+name="_xlnm\.Print_Area"[^>]*>([\s\S]*?)<\/definedName>/;
  return libro.datos.toString('utf8').match(patron)?.[1] ?? null;
}

export function areaImpresion(contenido: Buffer): string | null {
  return areaDeImpresion(leerZip(contenido));
}

export function compararPiezas(
  original: Buffer,
  salida: Buffer,
  permitidas: readonly string[],
): InformeGate {
  const piezasOriginales = leerZip(original);
  const piezasResultantes = leerZip(salida);
  const originales = new Map(piezasOriginales.map((pieza) => [pieza.nombre, hashDatos(pieza.datos)]));
  const resultantes = new Map(piezasResultantes.map((pieza) => [pieza.nombre, hashDatos(pieza.datos)]));

  const faltantes = [...originales.keys()].filter((nombre) => !resultantes.has(nombre));
  const nuevas = [...resultantes.keys()].filter((nombre) => !originales.has(nombre));
  const autorizadas: string[] = [];
  const noAutorizadas: string[] = [];

  for (const [nombre, hash] of originales) {
    const equivalente = resultantes.get(nombre);
    if (equivalente === undefined || equivalente === hash) {
      continue;
    }
    if (permitidas.includes(nombre)) {
      autorizadas.push(nombre);
    } else {
      noAutorizadas.push(nombre);
    }
  }

  const motivos: string[] = [];
  const areaOriginal = areaDeImpresion(piezasOriginales);
  const areaResultante = areaDeImpresion(piezasResultantes);
  if (areaOriginal !== null && areaResultante !== areaOriginal) {
    motivos.push(`area_de_impresion: esperado ${areaOriginal}, obtenido ${areaResultante ?? 'ausente'}`);
  }
  if (originales.has(piezaImpresion) && !resultantes.has(piezaImpresion)) {
    motivos.push(`pieza_faltante: ${piezaImpresion}`);
  }

  return {
    conforme:
      faltantes.length === 0 &&
      nuevas.length === 0 &&
      noAutorizadas.length === 0 &&
      motivos.length === 0,
    piezasAutorizadas: autorizadas,
    piezasNoAutorizadas: noAutorizadas,
    faltantes,
    nuevas,
    motivos,
  };
}

function contenidoPieza(piezas: PiezaZip[], nombre: string): string | undefined {
  return piezas.find((pieza) => pieza.nombre === nombre)?.datos.toString('utf8');
}

export function compararConDiffControlado(
  id: IdPlantilla,
  original: Buffer,
  salida: Buffer,
): InformeGateControlado {
  const descriptor = descriptorPlantilla(id);
  const base = compararPiezas(original, salida, descriptor.piezasAutorizadas());
  const piezasOriginales = leerZip(original);
  const piezasResultantes = leerZip(salida);
  const nombres = new Set([
    ...piezasOriginales.map((pieza) => pieza.nombre),
    ...piezasResultantes.map((pieza) => pieza.nombre),
  ]);

  const hojasPorPieza = new Map<string, string>(
    descriptor.celdas.map((celda) => [celda.pieza, celda.hoja]),
  );
  const declaradasPorPieza = new Map<string, Set<string>>();
  for (const celda of descriptor.celdas) {
    const declaradas = declaradasPorPieza.get(celda.pieza) ?? new Set<string>();
    declaradas.add(celda.referencia);
    declaradasPorPieza.set(celda.pieza, declaradas);
  }

  const diferencias: DiferenciaCelda[] = [];
  const diferenciasNoAutorizadas: DiferenciaCelda[] = [];
  for (const nombre of descriptor.piezasAutorizadas()) {
    const xmlOriginal = contenidoPieza(piezasOriginales, nombre);
    const xmlResultante = contenidoPieza(piezasResultantes, nombre);
    if (xmlOriginal === undefined || xmlResultante === undefined) {
      continue;
    }
    const originalMapa = mapaCeldas(xmlOriginal);
    const resultanteMapa = mapaCeldas(xmlResultante);
    const referencias = new Set([...originalMapa.keys(), ...resultanteMapa.keys()]);
    const hoja = hojasPorPieza.get(nombre) ?? '';
    const declaradas = declaradasPorPieza.get(nombre) ?? new Set<string>();

    for (const referencia of referencias) {
      const valorEsperado = originalMapa.get(referencia) ?? '';
      const valorObtenido = resultanteMapa.get(referencia) ?? '';
      if (valorEsperado === valorObtenido) {
        continue;
      }
      const diferencia: DiferenciaCelda = {
        hoja,
        celda: referencia,
        valorEsperado,
        valorObtenido,
      };
      if (declaradas.has(referencia)) {
        diferencias.push(diferencia);
      } else {
        diferenciasNoAutorizadas.push(diferencia);
      }
    }
  }

  const motivos = [...base.motivos];
  const areaOriginal = areaImpresion(original);
  const areaResultante = areaImpresion(salida);
  if (areaOriginal !== null && areaResultante !== areaImpresionEsperada) {
    motivos.push(
      `area_de_impresion_esperada: esperado ${areaImpresionEsperada}, obtenido ${areaResultante ?? 'ausente'}`,
    );
  }

  return {
    ...base,
    conforme:
      base.conforme &&
      motivos.length === 0 &&
      diferenciasNoAutorizadas.length === 0,
    piezasComparadas: nombres.size,
    piezasNoAutorizadas: [
      ...base.piezasNoAutorizadas,
      ...base.faltantes,
      ...base.nuevas,
    ],
    motivos,
    diferencias,
    diferenciasNoAutorizadas,
  };
}

export function verificarTextoPlano(
  original: Buffer,
  salida: Buffer,
  esperado: string,
): InformeTextoPlano {
  const descriptor = descriptorPlantilla('op');
  const rango = descriptor.rangoPlano;
  if (rango === undefined) {
    throw new Error('la plantilla OP no declara el rango del plano');
  }
  const piezasOriginales = leerZip(original);
  const piezasResultantes = leerZip(salida);
  const primeraHoja = descriptor.hojas()[0];
  if (primeraHoja === undefined) {
    throw new Error('la plantilla OP no declara la hoja 1640');
  }
  const piezaHoja = primeraHoja[1];
  const xmlOriginal = contenidoPieza(piezasOriginales, piezaHoja);
  const xmlResultante = contenidoPieza(piezasResultantes, piezaHoja);
  if (xmlOriginal === undefined || xmlResultante === undefined) {
    throw new Error(`falta la pieza ${piezaHoja} en la plantilla OP`);
  }
  const compartidosOriginales = compartidosDeXml(
    contenidoPieza(piezasOriginales, 'xl/sharedStrings.xml') ?? '',
  );
  const compartidosResultantes = compartidosDeXml(
    contenidoPieza(piezasResultantes, 'xl/sharedStrings.xml') ?? '',
  );

  const obtenido = textoDeRango(xmlResultante, rango.fusion, compartidosResultantes);
  const alternativaOriginal = textoDeRango(
    xmlOriginal,
    rango.alternativa.rango,
    compartidosOriginales,
  );
  const alternativaObtenida = textoDeRango(
    xmlResultante,
    rango.alternativa.rango,
    compartidosResultantes,
  );
  const alternativaIntacta =
    alternativaOriginal === rango.alternativa.texto &&
    alternativaObtenida === rango.alternativa.texto;

  return {
    conforme: obtenido === esperado && alternativaIntacta,
    esperado,
    obtenido,
    alternativaIntacta,
    alternativaOriginal,
    alternativaObtenida,
  };
}
