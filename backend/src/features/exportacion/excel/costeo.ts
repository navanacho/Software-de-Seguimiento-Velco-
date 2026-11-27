import type { MapaSemanticoPlanilla } from './mapeo';
import { compararConDiffControlado, type InformeGateControlado } from './gate';
import {
  descriptorPlantilla,
  FILAS_MATERIALES_COSTEO,
  type TipoCelda,
} from './inventario';
import { parchearPlantilla, type ValoresCelda } from './patcher';
import { celdaUnica } from './xml';
import { leerZip } from './zip';

export const ID_COSTEO_C14 = 'costeo-c14' as const;
const PIEZA_HOJA_1 = 'xl/worksheets/sheet2.xml';
const CLAVE_COSTO_UNITARIO = '.costoUnitario';

function estructuraValida(texto: string, tipo: TipoCelda): boolean {
  if (/^<c\s[^>]*\/>$/.test(texto)) {
    return !/\st="/.test(texto);
  }
  if (!/^<c\s[^>]*>[\s\S]*<\/c>$/.test(texto)) {
    return false;
  }
  const contenido = texto.replace(/^<c\s[^>]*>/, '').replace(/<\/c>$/, '');
  const formula = /(?:<f(?:\s[^>]*)?>[\s\S]*<\/f>|<f(?:\s[^>]*)?\/>)/.source;
  if (tipo === 'numerico') {
    return new RegExp(`^(?:${formula})?<v>[\\s\\S]*<\\/v>$`).test(contenido);
  }
  if (tipo === 'inlineStr') {
    return (
      new RegExp(`^(?:${formula})?<v>[\\s\\S]*<\\/v>$`).test(contenido) ||
      /^<is>[\s\S]*<\/is>$/.test(contenido)
    );
  }
  return false;
}

export function validarEstructuraCosteo(original: Buffer): void {
  const xml = leerZip(original).find((pieza) => pieza.nombre === PIEZA_HOJA_1)?.datos.toString('utf8');
  if (xml === undefined) {
    throw new Error(`falta la pieza ${PIEZA_HOJA_1} en la plantilla de costeo`);
  }
  for (const celda of descriptorPlantilla(ID_COSTEO_C14).celdas) {
    const texto = celdaUnica(xml, celda.referencia);
    if (!estructuraValida(texto, celda.tipo)) {
      throw new Error(`la celda ${celda.referencia} no tiene la estructura OOXML esperada`);
    }
  }
}

function costoUnitarioDelMaterial(mapa: MapaSemanticoPlanilla, clave: string): string | undefined {
  if (mapa[clave] !== undefined) {
    return mapa[clave];
  }
  const raiz = clave.slice(0, -CLAVE_COSTO_UNITARIO.length);
  const real = mapa[`${raiz}.costoUnitarioReal`];
  const cotizado = mapa[`${raiz}.costoUnitarioCotizado`];
  return real === undefined || real === '' ? cotizado : real;
}

export function valoresCosteo(mapa: MapaSemanticoPlanilla): ValoresCelda {
  for (const clave of Object.keys(mapa)) {
    const coincidencia = /^materiales\.(\d+)\./.exec(clave);
    const indice = coincidencia?.[1];
    if (indice !== undefined && Number(indice) >= FILAS_MATERIALES_COSTEO) {
      throw new Error(`el bloque B38:R59 no admite el material ${indice}`);
    }
  }

  const valores: Record<string, string> = {};
  for (const celda of descriptorPlantilla(ID_COSTEO_C14).celdas) {
    const valor = celda.clave.endsWith(CLAVE_COSTO_UNITARIO)
      ? costoUnitarioDelMaterial(mapa, celda.clave)
      : mapa[celda.clave];
    if (valor === undefined && !celda.clave.startsWith('materiales.')) {
      throw new Error(`falta el valor semántico ${celda.clave}`);
    }
    valores[celda.clave] = valor ?? '';
  }
  return valores;
}

export function verificarCosteo(original: Buffer, salida: Buffer): InformeGateControlado {
  return compararConDiffControlado(ID_COSTEO_C14, original, salida);
}

export function exigirGateConforme(informe: InformeGateControlado): void {
  if (informe.conforme) {
    return;
  }
  const motivos = [
    ...informe.motivos,
    ...informe.piezasNoAutorizadas.map((pieza) => `pieza no autorizada: ${pieza}`),
    ...informe.diferenciasNoAutorizadas.map(
      (diferencia) => `celda no declarada: ${diferencia.hoja}!${diferencia.celda}`,
    ),
  ];
  throw new Error(`gate de costeo no conforme: ${motivos.join('; ') || 'salida no verificada'}`);
}

export function generarCosteo(original: Buffer, mapa: MapaSemanticoPlanilla): Buffer {
  validarEstructuraCosteo(original);
  const salida = parchearPlantilla(ID_COSTEO_C14, original, valoresCosteo(mapa));
  exigirGateConforme(verificarCosteo(original, salida));
  return salida;
}
