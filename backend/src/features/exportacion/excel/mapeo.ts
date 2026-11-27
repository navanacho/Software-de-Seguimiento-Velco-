import { multiplicar, TIPOS_MATERIAL } from '@velco/domain';
import type {
  Decimal,
  MaterialModeloPlanilla,
  MaterialOperativoModeloPlanilla,
  ModeloPlanilla,
  TipoMaterial,
} from '@velco/domain';
import { descriptorPlantilla } from './inventario';

export type MapaSemanticoPlanilla = Readonly<Record<string, string>>;

interface Escala {
  readonly ceros: string;
}

const ESCALA_IMPORTE: Escala = { ceros: '00' };
const ESCALA_CANTIDAD: Escala = { ceros: '0000' };
const RE_DECIMAL = /^-?\d+(?:\.\d+)?$/;
const DESCRIPTOR_COSTEO = descriptorPlantilla('costeo');
const PREFIJOS_TIPO: Readonly<Record<TipoMaterial, string>> = {
  MP: '[MP]',
  INSUMOS: '[INSUMOS]',
  TERCERIZADOS: '[TERCERIZADOS]',
};

function esTipoMaterial(valor: unknown): valor is TipoMaterial {
  return typeof valor === 'string' && (TIPOS_MATERIAL as readonly string[]).includes(valor);
}

function esUnidad(valor: unknown): boolean {
  return valor === null || typeof valor === 'string';
}

export const HOJAS_COSTEO: readonly string[] = Object.freeze(
  DESCRIPTOR_COSTEO.hojas().map(([hoja]) => hoja),
);

function formatear(valor: Decimal, escala: Escala): string {
  if (!RE_DECIMAL.test(valor)) throw new Error(`decimal inválido: ${valor}`);
  const negativo = valor.startsWith('-');
  const sinSigno = negativo ? valor.slice(1) : valor;
  const [entero = '0', fraccion = ''] = sinSigno.split('.');
  const magnitud = BigInt(`${entero}${fraccion}`);
  const total = escala.ceros.length;

  if (fraccion.length > total) {
    const divisor = 10n ** BigInt(fraccion.length - total);
    const cociente = magnitud / divisor;
    const resto = magnitud % divisor;
    const redondeado = resto * 2n >= divisor ? cociente + 1n : cociente;
    const texto = redondeado.toString().padStart(total + 1, '0');
    const parteEntera = texto.slice(0, texto.length - total);
    const parteDecimal = texto.slice(texto.length - total);
    const signo = negativo && redondeado !== 0n ? '-' : '';
    return `${signo}${parteEntera}.${parteDecimal}`;
  }

  const signo = negativo && magnitud !== 0n ? '-' : '';
  return `${signo}${entero}.${fraccion.padEnd(total, '0')}`;
}

export function formatearImporte(valor: Decimal): string {
  return formatear(valor, ESCALA_IMPORTE);
}

export function formatearCantidad(valor: Decimal): string {
  return formatear(valor, ESCALA_CANTIDAD);
}

function esMaterialCosteoModelo(
  material: MaterialOperativoModeloPlanilla | MaterialModeloPlanilla,
): material is MaterialModeloPlanilla {
  return 'costoUnitarioCotizado' in material;
}

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function esDecimal(valor: unknown): valor is Decimal {
  return typeof valor === 'string' && RE_DECIMAL.test(valor);
}

function esFilaComparativa(valor: unknown): boolean {
  if (!esObjeto(valor)) return false;
  const etapaValida = valor.etapaId === null || typeof valor.etapaId === 'string';
  const porcentajeValido = valor.porcentajeConsumo === null || esDecimal(valor.porcentajeConsumo);
  return (
    etapaValida &&
    typeof valor.nombreEtapa === 'string' &&
    esDecimal(valor.horasVendidas) &&
    esDecimal(valor.horasReales) &&
    esDecimal(valor.desvioHoras) &&
    porcentajeValido &&
    typeof valor.alertaDesvio === 'boolean'
  );
}

function esMaterialOperativo(valor: unknown): boolean {
  return (
    esObjeto(valor) &&
    esTipoMaterial(valor.tipo) &&
    typeof valor.descripcion === 'string' &&
    esDecimal(valor.cantidad) &&
    esUnidad(valor.unidad) &&
    !('costoUnitarioCotizado' in valor) &&
    !('costoUnitarioReal' in valor)
  );
}

function esMaterialCosteo(valor: unknown): boolean {
  if (!esObjeto(valor)) return false;
  return (
    esTipoMaterial(valor.tipo) &&
    typeof valor.descripcion === 'string' &&
    esDecimal(valor.cantidad) &&
    esUnidad(valor.unidad) &&
    esDecimal(valor.costoUnitarioCotizado) &&
    (valor.costoUnitarioReal === null || esDecimal(valor.costoUnitarioReal))
  );
}

export function esModeloCompartido(valor: unknown): valor is ModeloPlanilla {
  if (!esObjeto(valor)) return false;
  if (valor.variante !== 'costeo' && valor.variante !== 'operativa') return false;
  if ('codigo_plano' in valor || 'O7' in valor || 'J7' in valor) return false;
  if (typeof valor.cliente !== 'string' || typeof valor.numeroOp !== 'string') return false;
  if (!esDecimal(valor.horasVendidas) || !esDecimal(valor.horasReales) || !esDecimal(valor.valorHora)) return false;
  if (!Array.isArray(valor.comparativa) || !Array.isArray(valor.materiales)) return false;
  if (!valor.comparativa.every(esFilaComparativa)) return false;

  if (valor.variante === 'operativa') {
    return !('costos' in valor) && !('margenReal' in valor) && valor.materiales.every(esMaterialOperativo);
  }

  if (
    !esObjeto(valor.costos) ||
    !esDecimal(valor.costos.costoMaterialesCotizado) ||
    !esDecimal(valor.costos.costoMaterialesReal) ||
    !esDecimal(valor.margenReal)
  ) {
    return false;
  }
  return valor.materiales.every(esMaterialCosteo);
}

export function mapearModeloACeldas(modelo: ModeloPlanilla): MapaSemanticoPlanilla {
  const costeo = modelo.variante === 'costeo' ? modelo : null;
  const mapa: Record<string, string> = {
    cliente: modelo.cliente,
    numeroOp: modelo.numeroOp,
    horasVendidas: formatearImporte(modelo.horasVendidas),
    horasReales: formatearImporte(modelo.horasReales),
    valorHora: formatearImporte(modelo.valorHora),
  };

  modelo.materiales.forEach((material, indice) => {
    const prefijo = `materiales.${indice}`;
    mapa[`${prefijo}.descripcion`] = `${PREFIJOS_TIPO[material.tipo]} ${material.descripcion}`;
    mapa[`${prefijo}.cantidad`] = formatearCantidad(material.cantidad);
    mapa[`${prefijo}.un`] = material.unidad ?? '';
    if (costeo !== null && esMaterialCosteoModelo(material)) {
      const costoCotizado = formatearImporte(material.costoUnitarioCotizado);
      const costoReal = material.costoUnitarioReal === null ? '' : formatearImporte(material.costoUnitarioReal);
      mapa[`${prefijo}.costoUnitarioCotizado`] = costoCotizado;
      mapa[`${prefijo}.costoUnitarioReal`] = costoReal;
      mapa[`${prefijo}.costoUnitario`] = costoReal === '' ? costoCotizado : costoReal;
      mapa[`${prefijo}.costoTotal`] = formatearImporte(
        multiplicar(material.cantidad, material.costoUnitarioReal ?? material.costoUnitarioCotizado),
      );
    }
  });

  modelo.comparativa.forEach((fila, indice) => {
    const prefijo = `comparativa.${indice}`;
    mapa[`${prefijo}.etapa`] = fila.nombreEtapa;
    mapa[`${prefijo}.horasVendidas`] = formatearImporte(fila.horasVendidas);
    mapa[`${prefijo}.horasReales`] = formatearImporte(fila.horasReales);
    mapa[`${prefijo}.desvioHoras`] = formatearImporte(fila.desvioHoras);
    mapa[`${prefijo}.porcentajeConsumo`] = fila.porcentajeConsumo === null ? '' : formatearImporte(fila.porcentajeConsumo);
    mapa[`${prefijo}.alertaDesvio`] = fila.alertaDesvio ? 'SÍ' : 'NO';
  });

  if (costeo !== null) {
    mapa['costos.costoMaterialesCotizado'] = formatearImporte(costeo.costos.costoMaterialesCotizado);
    mapa['costos.costoMaterialesReal'] = formatearImporte(costeo.costos.costoMaterialesReal);
    mapa.margenReal = formatearImporte(costeo.margenReal);
  }

  return mapa;
}
