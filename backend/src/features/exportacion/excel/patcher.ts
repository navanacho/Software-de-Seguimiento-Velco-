import { descriptorPlantilla, type IdPlantilla } from './inventario';
import { parchearCeldaConValor, parchearCeldaPlano, valorPlano } from './xml';
import { escribirZip, leerZip, type PiezaZip } from './zip';

export type ValoresCelda = Readonly<Record<string, string>>;

export function parchearPlantilla(
  id: IdPlantilla,
  contenido: Buffer,
  valores: ValoresCelda,
  plano?: string | null,
): Buffer {
  const descriptor = descriptorPlantilla(id);
  const piezas: PiezaZip[] = leerZip(contenido);
  const xmlPorPieza = new Map<string, string>(
    piezas.map((pieza) => [pieza.nombre, pieza.datos.toString('utf8')]),
  );

  for (const celda of descriptor.celdas) {
    const xml = xmlPorPieza.get(celda.pieza);
    if (xml === undefined) {
      throw new Error(`falta la pieza ${celda.pieza} en la plantilla ${descriptor.archivo}`);
    }
    const esCeldaDelPlano = descriptor.rangoPlano?.celda === celda.referencia && celda.tipo === 'inlineStr';
    const valor = esCeldaDelPlano ? valorPlano(plano) : valores[celda.clave];
    if (valor === undefined) {
      throw new Error(`falta el valor de BD para ${celda.clave}`);
    }
    xmlPorPieza.set(
      celda.pieza,
      celda.tipo === 'inlineStr'
        ? parchearCeldaPlano(xml, celda, valor)
        : parchearCeldaConValor(xml, celda, valor),
    );
  }

  return escribirZip(
    piezas.map((pieza) => {
      const xml = xmlPorPieza.get(pieza.nombre);
      return xml === undefined || xml === pieza.datos.toString('utf8')
        ? pieza
        : { ...pieza, datos: Buffer.from(xml, 'utf8') };
    }),
  );
}
