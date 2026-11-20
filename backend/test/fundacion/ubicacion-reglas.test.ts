import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const raiz = resolve(process.cwd(), '..');

function archivos(directorio: string): string[] {
  if (!existsSync(directorio)) {
    return [];
  }
  return readdirSync(directorio, { withFileTypes: true }).flatMap((entrada) => {
    const ruta = join(directorio, entrada.name);
    return entrada.isDirectory() ? archivos(ruta) : [ruta];
  });
}

const NOMBRES = 'calcularAvance|calcularSemaforo|calcularMargen|diasRestantes|agruparFlujo|etapaAhora';
const DEFINICION = `(?:export\\s+)?(?:function\\s+(${NOMBRES})\\s*\\(|(?:const|let|var)\\s+(${NOMBRES})\\s*=)`;
const REGLAS = new RegExp(DEFINICION);
const REGLAS_TODAS = new RegExp(DEFINICION, 'g');
const RN = /RN-[A-Z]+-\d+/;
const DOMINIO = 'packages/domain/src/';
const FUENTE_PRODUCCION = /\.(ts|tsx)$/;
const TEST = /\.test\.tsx?$/;

function normalizar(ruta: string): string {
  return ruta.replaceAll('\\', '/');
}

function definicionesEncontradas(
  rutas: readonly string[],
  leer: (ruta: string) => string,
): string[] {
  return rutas.filter((ruta) => REGLAS.test(leer(ruta)));
}

function nombresDefinidos(contenido: string): string[] {
  return Array.from(contenido.matchAll(REGLAS_TODAS), (coincidencia) => coincidencia[1] ?? coincidencia[2] ?? '');
}

function definicionesFueraDeDominio(
  rutas: readonly string[],
  leer: (ruta: string) => string,
): string[] {
  return definicionesEncontradas(rutas, leer).filter((ruta) => !normalizar(ruta).includes(DOMINIO));
}

function citasRnEnProduccion(
  rutas: readonly string[],
  leer: (ruta: string) => string,
): string[] {
  return rutas.filter((ruta) => RN.test(leer(ruta)));
}

function leerReal(ruta: string): string {
  return readFileSync(ruta, 'utf8');
}

function esFuenteProduccion(ruta: string): boolean {
  return FUENTE_PRODUCCION.test(ruta) && !TEST.test(ruta);
}

const fuentesProduccion = [
  ...archivos(join(raiz, 'backend', 'src')),
  ...archivos(join(raiz, 'frontend', 'src')),
  ...archivos(join(raiz, 'packages', 'domain', 'src')),
].filter(esFuenteProduccion);

describe('ubicación de las reglas de negocio', () => {
  it('no reporta una definición dentro de packages/domain/src/', () => {
    const rutaDominio = join(raiz, 'packages', 'domain', 'src', 'ordenes', 'avance.ts');
    expect(
      definicionesFueraDeDominio([rutaDominio], () => 'export function calcularAvance(etapas) {}'),
      `${rutaDominio} define la regla en el dominio y no debe ser reportado`,
    ).toEqual([]);
  });

  it('reporta la misma firma cuando aparece en un adaptador http', () => {
    const rutaAdaptador = join(raiz, 'backend', 'src', 'features', 'ordenes', 'http', 'fake.ts');
    expect(
      definicionesFueraDeDominio([rutaAdaptador], () => 'function calcularMargen(op) {}'),
      `${rutaAdaptador} define una regla fuera del dominio y debe ser reportado`,
    ).toEqual([rutaAdaptador]);
  });

  it('reporta una definición arrow con const en un adaptador http', () => {
    const rutaAdaptador = join(raiz, 'backend', 'src', 'features', 'ordenes', 'http', 'arrow.ts');
    expect(
      definicionesFueraDeDominio([rutaAdaptador], () => 'const calcularMargen = (op) => op.total;'),
      `${rutaAdaptador} define una regla con const/arrow fuera del dominio y debe ser reportado`,
    ).toEqual([rutaAdaptador]);
  });

  it('no reporta una definición arrow con const dentro de packages/domain/src/', () => {
    const rutaDominio = join(raiz, 'packages', 'domain', 'src', 'ordenes', 'avance-arrow.ts');
    const leer = () => 'export const calcularAvance = (etapas) => etapas.length;';
    expect(
      definicionesEncontradas([rutaDominio], leer),
      `${rutaDominio} usa const/arrow y debe contar como definición`,
    ).toEqual([rutaDominio]);
    expect(
      definicionesFueraDeDominio([rutaDominio], leer),
      `${rutaDominio} define la regla en el dominio y no debe ser reportado`,
    ).toEqual([]);
  });

  it('no reporta referencias que no son definiciones en un adaptador', () => {
    const rutaAdaptador = join(raiz, 'backend', 'src', 'features', 'ordenes', 'http', 'referencias.ts');
    const leer = () => [
      "import { calcularAvance } from '@velco/domain';",
      'export { calcularSemaforo };',
      'const avance = calcularAvance(etapas);',
    ].join('\n');
    expect(
      definicionesEncontradas([rutaAdaptador], leer),
      `${rutaAdaptador} solo referencia reglas y no debe contar como definición`,
    ).toEqual([]);
    expect(
      definicionesFueraDeDominio([rutaAdaptador], leer),
      `${rutaAdaptador} no define reglas y no debe ser reportado`,
    ).toEqual([]);
  });

  it('encuentra al menos una definición real en las fuentes de producción', () => {
    const definiciones = definicionesEncontradas(fuentesProduccion, leerReal);
    expect(definiciones.length, 'debe existir al menos una regla definida en fuentes vivas').toBeGreaterThan(0);
  });

  it('mantiene todas las definiciones reales bajo packages/domain/src/', () => {
    const definiciones = definicionesEncontradas(fuentesProduccion, leerReal);
    expect(
      definiciones.every((ruta) => normalizar(ruta).includes(DOMINIO)),
      `definiciones fuera del dominio: ${definicionesFueraDeDominio(fuentesProduccion, leerReal).join(', ')}`,
    ).toBe(true);
    expect(
      definicionesFueraDeDominio(fuentesProduccion, leerReal),
      'ninguna regla viva debe definirse fuera de packages/domain/src/',
    ).toEqual([]);
  });

  it('detecta con la regex ampliada las cinco definiciones reales', () => {
    const detectados = new Set(
      fuentesProduccion.flatMap((ruta) => nombresDefinidos(leerReal(ruta))),
    );
    const esperados = ['diasRestantes', 'calcularSemaforo', 'calcularAvance', 'etapaAhora', 'agruparFlujo'];
    expect(
      esperados.filter((nombre) => !detectados.has(nombre)),
      'las cinco reglas reales deben detectarse con la regex ampliada',
    ).toEqual([]);
  });

  it('detecta una cita RN en una fuente inyectada', () => {
    const ruta = join(raiz, 'backend', 'src', 'features', 'semaforo', 'application', 'regla.ts');
    expect(
      citasRnEnProduccion([ruta], () => 'RN-SEMAFORO-03 define el umbral'),
      `${ruta} cita una RN y debe ser reportado`,
    ).toEqual([ruta]);
  });

  it('excluye ordenes/avance.test.ts de las fuentes inspeccionadas', () => {
    const rutaTest = join(raiz, 'packages', 'domain', 'src', 'ordenes', 'avance.test.ts');
    expect(fuentesProduccion, `${rutaTest} es un test y no debe inspeccionarse`).not.toContain(rutaTest);
    expect(
      fuentesProduccion.some((ruta) => TEST.test(ruta)),
      'ningún *.test.ts ni *.test.tsx debe entrar en fuentesProduccion',
    ).toBe(false);
    expect(
      citasRnEnProduccion(fuentesProduccion, leerReal),
      'las citas RN legítimas viven en tests y no deben reportarse',
    ).toEqual([]);
  });

  it('detecta una definición hipotética de calcularMargen en un handler', () => {
    const rutaHandler = join(raiz, 'backend', 'src', 'features', 'ordenes', 'http', 'handler.ts');
    expect(
      definicionesFueraDeDominio([rutaHandler], () => 'export function calcularMargen(orden) {}'),
      `${rutaHandler} define una regla fuera del dominio y debe ser reportado`,
    ).toEqual([rutaHandler]);
  });

  it('no encuentra calcularMargen en las fuentes reales de producción', () => {
    const conMargen = fuentesProduccion.filter((ruta) => {
      const contenido = leerReal(ruta);
      return REGLAS.test(contenido) && /calcularMargen/.test(contenido);
    });
    expect(conMargen, 'calcularMargen recién debe aparecer con C-11').toEqual([]);
  });
});
