export interface RegistroHora {
  readonly id: string;
  readonly ordenId: string;
  readonly etapaId: string | null;
  readonly operario: string;
  readonly fecha: string;
  readonly horas: string;
  readonly createdAt: string;
  readonly observacion?: string | null;
}

export interface NuevoRegistroHora {
  readonly ordenId: string;
  readonly etapaId?: string | null;
  readonly operario: string;
  readonly fecha: string;
  readonly horas: string;
  readonly observacion?: string | null;
}

export type ResultadoValidacion =
  | { readonly ok: true }
  | { readonly ok: false; readonly error: string };

const RE_HORAS = /^\d+(\.\d{1,2})?$/;
const RE_FECHA = /^\d{4}-\d{2}-\d{2}$/;

function esFechaCalendario(valor: string): boolean {
  if (!RE_FECHA.test(valor)) return false;
  const fecha = new Date(`${valor}T00:00:00.000Z`);
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor;
}

function aCentesimas(valor: string): bigint {
  const [enteroRaw = '0', decRaw = ''] = valor.split('.');
  const signo = enteroRaw.startsWith('-') ? -1n : 1n;
  const entero = enteroRaw.replace('-', '');
  const dec = (decRaw + '00').slice(0, 2);
  return signo * (BigInt(entero || '0') * 100n + BigInt(dec));
}

function desdeCentesimas(valor: bigint): string {
  const signo = valor < 0n ? '-' : '';
  const abs = valor < 0n ? -valor : valor;
  const entero = abs / 100n;
  const dec = abs % 100n;
  return `${signo}${entero.toString()}.${dec.toString().padStart(2, '0')}`;
}

function normalizarHoras(valor: string): string | null {
  const t = valor.trim();
  if (!RE_HORAS.test(t)) return null;
  return desdeCentesimas(aCentesimas(t));
}

export function validarRegistroHora(parte: NuevoRegistroHora): ResultadoValidacion {
  if (parte.operario.trim().length === 0) return { ok: false, error: 'operario vacío' };
  if (!esFechaCalendario(parte.fecha)) return { ok: false, error: 'fecha inválida' };
  const horas = normalizarHoras(parte.horas);
  if (horas === null) return { ok: false, error: 'horas inválidas' };
  if (aCentesimas(horas) <= 0n) return { ok: false, error: 'horas debe ser mayor a 0' };
  return { ok: true };
}

export function calcularHorasRealesTotales(horas: readonly string[]): string {
  let total = 0n;
  for (const h of horas) {
    const normalizada = normalizarHoras(h);
    if (normalizada === null) throw new Error(`horas inválidas: ${h}`);
    total += aCentesimas(normalizada);
  }
  return desdeCentesimas(total);
}

export function calcularHorasVendidasTotales(horasVendidas: readonly string[]): string {
  let total = 0n;
  for (const h of horasVendidas) {
    const normalizada = normalizarHoras(h);
    if (normalizada === null) throw new Error(`horasVendidas inválidas: ${h}`);
    total += aCentesimas(normalizada);
  }
  return desdeCentesimas(total);
}

export function calcularDesvioHoras(
  horasVendidas: readonly string[],
  horasReales: readonly string[],
): string {
  const vendidas = aCentesimas(calcularHorasVendidasTotales(horasVendidas));
  const reales = aCentesimas(calcularHorasRealesTotales(horasReales));
  return desdeCentesimas(vendidas - reales);
}

export function calcularConsumoHoras(horasReales: string, horasVendidas: string): string | null {
  const vendidas = aCentesimas(normalizarHoras(horasVendidas) ?? horasVendidas);
  if (vendidas === 0n) return null;
  const reales = aCentesimas(normalizarHoras(horasReales) ?? horasReales);
  const consumoCentesimas = (reales * 10000n) / vendidas; // porcentaje con 2 decimales
  return desdeCentesimas(consumoCentesimas);
}

export interface EntradaAlertaDesvio {
  readonly consumo: string | null;
  readonly avance: number;
  readonly horasReales: string;
  readonly horasVendidas: string;
}

export function evaluarAlertaDesvio(entrada: EntradaAlertaDesvio): boolean {
  const reales = aCentesimas(normalizarHoras(entrada.horasReales) ?? entrada.horasReales);
  const vendidas = aCentesimas(normalizarHoras(entrada.horasVendidas) ?? entrada.horasVendidas);
  if (reales > vendidas) return true;
  if (entrada.consumo === null) return false;
  const consumo = aCentesimas(normalizarHoras(entrada.consumo) ?? entrada.consumo);
  const umbral = BigInt(entrada.avance + 15) * 100n;
  return consumo > umbral;
}
