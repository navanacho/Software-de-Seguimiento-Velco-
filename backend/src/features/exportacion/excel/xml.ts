import type { CeldaDescriptor } from './inventario';

export function escaparXml(valor: string): string {
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function patronCelda(referencia: string): RegExp {
  return new RegExp(`<c r="${referencia}"(?:\\s[^>]*?)?(?:/>|>[\\s\\S]*?</c>)`);
}

export function celdaUnica(xml: string, referencia: string): string {
  const coincidencias = xml.match(patronCelda(referencia)) ?? [];
  if (coincidencias.length !== 1) {
    throw new Error(`se esperaba una sola celda ${referencia} y se encontraron ${coincidencias.length}`);
  }
  return coincidencias[0];
}

export function parchearCeldaConValor(xml: string, celda: CeldaDescriptor, valor: string): string {
  const original = celdaUnica(xml, celda.referencia);
  if (!/<f>[\s\S]*<\/f><v>[\s\S]*<\/v><\/c>$/.test(original)) {
    throw new Error(`la celda ${celda.referencia} no tiene el par <f>…</f><v>…</v> esperado`);
  }
  const apertura = original.slice(0, original.indexOf('>') + 1);
  return xml.replace(original, `${apertura}<v>${escaparXml(valor)}</v></c>`);
}

export function parchearCeldaPlano(xml: string, celda: CeldaDescriptor, valor: string): string {
  const original = celdaUnica(xml, celda.referencia);
  const atributos = original
    .replace(/^<c\s+/, '')
    .replace(/\/>$/, '')
    .replace(/>$/, '')
    .trim();
  const sinTipo = atributos.replace(/\s+t="[^"]*"/, '');
  return xml.replace(original, `<c ${sinTipo} t="inlineStr"><is><t>${escaparXml(valor)}</t></is></c>`);
}

export function valorPlano(plano: string | null | undefined): string {
  if (plano === undefined) {
    throw new Error('la plantilla requiere el valor del plano');
  }
  return plano === null ? 'ID Plano: S/P' : `ID Plano: ${plano}`;
}

export function desescaparXml(valor: string): string {
  return valor
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

export function mapaCeldas(xml: string): ReadonlyMap<string, string> {
  const celdas = new Map<string, string>();
  for (const coincidencia of xml.matchAll(/<c r="([^"]+)"(?:\s[^>]*?)?(?:\/>|>[\s\S]*?<\/c>)/g)) {
    const referencia = coincidencia[1];
    if (referencia === undefined) {
      continue;
    }
    if (celdas.has(referencia)) {
      throw new Error(`referencia ${referencia} duplicada en la hoja`);
    }
    const celda = coincidencia[0];
    if (celda !== undefined) {
      celdas.set(referencia, celda);
    }
  }
  return celdas;
}

function parteReferencia(referencia: string): { columna: string; fila: number } {
  const coincidencia = /^([A-Z]+)(\d+)$/.exec(referencia);
  const columna = coincidencia?.[1];
  const fila = coincidencia?.[2];
  if (columna === undefined || fila === undefined) {
    throw new Error(`referencia de celda inválida: ${referencia}`);
  }
  return { columna, fila: Number(fila) };
}

function indiceColumna(columna: string): number {
  return [...columna].reduce((total, letra) => total * 26 + letra.charCodeAt(0) - 64, 0);
}

function columnaDesdeIndice(indice: number): string {
  let restante = indice;
  let columna = '';
  while (restante > 0) {
    const modulo = (restante - 1) % 26;
    columna = String.fromCharCode(65 + modulo) + columna;
    restante = Math.floor((restante - 1) / 26);
  }
  return columna;
}

export function referenciasDeRango(xml: string, rango: string): string[] {
  const extremos = rango.split(':');
  const inicio = extremos[0];
  const fin = extremos[1];
  if (inicio === undefined || fin === undefined || extremos.length !== 2) {
    throw new Error(`rango inválido: ${rango}`);
  }
  const desde = parteReferencia(inicio);
  const hasta = parteReferencia(fin);
  if (desde.fila > hasta.fila || indiceColumna(desde.columna) > indiceColumna(hasta.columna)) {
    throw new Error(`rango invertido: ${rango}`);
  }

  const presentes = mapaCeldas(xml);
  const referencias: string[] = [];
  for (let fila = desde.fila; fila <= hasta.fila; fila += 1) {
    for (
      let columna = indiceColumna(desde.columna);
      columna <= indiceColumna(hasta.columna);
      columna += 1
    ) {
      const referencia = `${columnaDesdeIndice(columna)}${fila}`;
      if (presentes.has(referencia)) {
        referencias.push(referencia);
      }
    }
  }
  if (referencias.length === 0) {
    throw new Error(`el rango ${rango} no contiene celdas presentes`);
  }
  return referencias;
}

export function compartidosDeXml(xml: string): string[] {
  return [...xml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((coincidencia) => {
    const contenido = coincidencia[1] ?? '';
    const texto = [...contenido.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)]
      .map((parte) => parte[1] ?? '')
      .join('');
    return desescaparXml(texto);
  });
}

function textoDeCelda(celda: string | undefined, compartidos: readonly string[]): string {
  if (celda === undefined) {
    return '';
  }
  const inline = [...celda.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)]
    .map((parte) => parte[1] ?? '')
    .join('');
  if (inline !== '') {
    return desescaparXml(inline);
  }
  const compartido = celda.match(/t="s"[^>]*>\s*<v>(\d+)<\/v>/)?.[1];
  if (compartido !== undefined) {
    return compartidos[Number(compartido)] ?? '';
  }
  const valor = celda.match(/<v>([\s\S]*?)<\/v>/)?.[1];
  return valor === undefined ? '' : desescaparXml(valor);
}

export function textoDeRango(
  xml: string,
  rango: string,
  compartidos: readonly string[] = [],
): string {
  const celdas = mapaCeldas(xml);
  return referenciasDeRango(xml, rango)
    .map((referencia) => textoDeCelda(celdas.get(referencia), compartidos))
    .join('');
}
