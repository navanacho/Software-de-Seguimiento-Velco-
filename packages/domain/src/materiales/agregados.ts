export interface MaterialParaAgregado {
  readonly cantidad: string;
  readonly costoUnitarioCotizado: string;
  readonly costoUnitarioReal: string | null;
}

export interface AgregadosMateriales {
  readonly costoMaterialesCotizado: string;
  readonly costoMaterialesReal: string;
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

export function calcularAgregadosMateriales(materiales: readonly MaterialParaAgregado[]): AgregadosMateriales {
  let cotizado = 0n;
  let real = 0n;
  for (const m of materiales) {
    const cantidad = aCentesimas(m.cantidad);
    const cot = aCentesimas(m.costoUnitarioCotizado);
    const realUnit = aCentesimas(m.costoUnitarioReal ?? m.costoUnitarioCotizado);
    cotizado += (cantidad * cot) / 100n;
    real += (cantidad * realUnit) / 100n;
  }
  return {
    costoMaterialesCotizado: desdeCentesimas(cotizado),
    costoMaterialesReal: desdeCentesimas(real),
  };
}
