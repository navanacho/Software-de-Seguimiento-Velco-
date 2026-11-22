import { TIPOS_MATERIAL, type NuevoMaterialOrden, type TipoMaterial } from './contrato.ts';

function esDecimalPositivo(valor: string): boolean {
  return /^\d+(\.\d+)?$/.test(valor) && Number(valor) > 0;
}
function esDecimalNoNegativo(valor: string): boolean {
  return /^\d+(\.\d+)?$/.test(valor) && Number(valor) >= 0;
}
function normalizarOpcional(valor: string | null | undefined, max: number): string | null {
  if (valor === undefined || valor === null) return null;
  const t = valor.trim();
  if (t.length === 0) return null;
  if (t.length > max) throw new Error('validation_error:material');
  return t;
}

export function validarNuevoMaterial(input: unknown): NuevoMaterialOrden {
  if (typeof input !== 'object' || input === null) throw new Error('validation_error:material');
  const r = input as Record<string, unknown>;
  if (!TIPOS_MATERIAL.includes(r.tipo as TipoMaterial)) throw new Error('validation_error:material.tipo');
  const descripcion = typeof r.descripcion === 'string' ? r.descripcion.trim() : '';
  if (descripcion.length === 0) throw new Error('validation_error:material.descripcion');
  const cantidad = String(r.cantidad ?? '');
  if (!esDecimalPositivo(cantidad)) throw new Error('validation_error:material.cantidad');
  const cotizado = String(r.costoUnitarioCotizado ?? '');
  if (!esDecimalNoNegativo(cotizado)) throw new Error('validation_error:material.costoUnitarioCotizado');
  const realRaw = r.costoUnitarioReal;
  const real = realRaw === undefined || realRaw === null || String(realRaw).trim() === '' ? null : String(realRaw);
  if (real !== null && !esDecimalNoNegativo(real)) throw new Error('validation_error:material.costoUnitarioReal');
  return {
    tipo: r.tipo as TipoMaterial,
    descripcion,
    cantidad,
    unidad: normalizarOpcional(r.unidad as string | null | undefined, 20),
    costoUnitarioCotizado: cotizado,
    costoUnitarioReal: real,
    nroRemito: normalizarOpcional(r.nroRemito as string | null | undefined, 50),
    nroFactura: normalizarOpcional(r.nroFactura as string | null | undefined, 50),
    nt: normalizarOpcional(r.nt as string | null | undefined, 50),
    po: normalizarOpcional(r.po as string | null | undefined, 50),
  };
}
