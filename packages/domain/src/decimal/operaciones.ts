export type Decimal = string;

const RE_DECIMAL = /^-?\d+(?:\.\d+)?$/;
const ESCALA_IMPORTES = 2;
const ESCALA_PRODUCTO = 4;

interface ValorDecimal {
  readonly signo: bigint;
  readonly escala: number;
  readonly magnitud: bigint;
}

function analizar(valor: Decimal): ValorDecimal {
  if (!RE_DECIMAL.test(valor)) throw new Error(`decimal inválido: ${valor}`);
  const negativo = valor.startsWith('-');
  const sinSigno = negativo ? valor.slice(1) : valor;
  const [entero = '0', fraccion = ''] = sinSigno.split('.');
  const magnitud = BigInt(`${entero}${fraccion}`);
  return {
    signo: negativo && magnitud !== 0n ? -1n : 1n,
    escala: fraccion.length,
    magnitud,
  };
}

function potencia10(exponente: number): bigint {
  let resultado = 1n;
  for (let i = 0; i < exponente; i += 1) resultado *= 10n;
  return resultado;
}

function formatear(
  magnitud: bigint,
  escala: number,
  signo: bigint,
  maxima: number,
  preservarEscala: boolean,
): Decimal {
  const texto = magnitud.toString().padStart(escala + 1, '0');
  const corte = texto.length - escala;
  const entero = escala === 0 ? texto : texto.slice(0, corte);
  const fraccionOriginal = escala === 0 ? '' : texto.slice(corte);
  const tieneDecimalesSignificativos = /[1-9]/.test(fraccionOriginal.slice(ESCALA_IMPORTES));
  const destino = preservarEscala && tieneDecimalesSignificativos
    ? escala
    : Math.max(ESCALA_IMPORTES, Math.min(escala, maxima));
  let fraccion = fraccionOriginal;
  while (fraccion.length > destino && fraccion.endsWith('0')) fraccion = fraccion.slice(0, -1);
  fraccion = fraccion.padEnd(destino, '0');
  const prefijo = signo < 0n && magnitud !== 0n ? '-' : '';
  return `${prefijo}${entero}.${fraccion}`;
}

function alinear(a: ValorDecimal, b: ValorDecimal): { readonly a: bigint; readonly b: bigint; readonly escala: number } {
  const escala = Math.max(a.escala, b.escala);
  return {
    a: a.signo * a.magnitud * potencia10(escala - a.escala),
    b: b.signo * b.magnitud * potencia10(escala - b.escala),
    escala,
  };
}

export function desdeCadena(valor: Decimal): Decimal {
  const analizado = analizar(valor);
  return formatear(analizado.magnitud, analizado.escala, analizado.signo, ESCALA_IMPORTES, true);
}

export function sumar(a: Decimal, b: Decimal): Decimal {
  const alineados = alinear(analizar(a), analizar(b));
  const resultado = alineados.a + alineados.b;
  return formatear(resultado < 0n ? -resultado : resultado, alineados.escala, resultado < 0n ? -1n : 1n, ESCALA_IMPORTES, true);
}

export function restar(a: Decimal, b: Decimal): Decimal {
  const alineados = alinear(analizar(a), analizar(b));
  const resultado = alineados.a - alineados.b;
  return formatear(resultado < 0n ? -resultado : resultado, alineados.escala, resultado < 0n ? -1n : 1n, ESCALA_IMPORTES, true);
}

export function multiplicar(a: Decimal, b: Decimal): Decimal {
  const izquierdo = analizar(a);
  const derecho = analizar(b);
  const resultado = izquierdo.magnitud * derecho.magnitud;
  const signo = izquierdo.signo * derecho.signo;
  return formatear(resultado, izquierdo.escala + derecho.escala, signo, ESCALA_PRODUCTO, false);
}

export function comparar(a: Decimal, b: Decimal): -1 | 0 | 1 {
  const alineados = alinear(analizar(a), analizar(b));
  if (alineados.a < alineados.b) return -1;
  if (alineados.a > alineados.b) return 1;
  return 0;
}
