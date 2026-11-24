import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { construirTarjetaOrden } from '@velco/domain';
import { describe, expect, it } from 'vitest';
import { contextoTarjeta } from '../../src/features/configuracion/application/contextoTarjeta.ts';
import { crearDependenciasFalsas, crearEtapas, crearOrden } from '../tablero-read-api/fixtures.ts';

const raiz = resolve(process.cwd(), '..');

function archivos(directorio: string): string[] {
  if (!existsSync(directorio)) return [];
  return readdirSync(directorio, { withFileTypes: true }).flatMap((entrada) => {
    const ruta = join(directorio, entrada.name);
    return entrada.isDirectory() ? archivos(ruta) : [ruta];
  });
}

describe('sin derivados persistidos ni duplicados (R3)', () => {
  it('el modelo Configuracion conserva exactamente sus cinco columnas originales', () => {
    const esquema = readFileSync(join(raiz, 'backend', 'prisma', 'schema.prisma'), 'utf8');
    const bloque = esquema.match(/model Configuracion \{([\s\S]*?)\n\}/)?.[1] ?? '';
    const campos = Array.from(bloque.matchAll(/^\s{2}(\w+)\s+/gm), (coincidencia) => coincidencia[1]);
    expect(campos).toEqual([
      'id', 'valorHoraEstandar', 'diasAlertaRiesgo', 'porcentajeAvanceRiesgo', 'etapasDefault',
    ]);
  });

  it('la definición de calcularSemaforo sigue viviendo solo en el dominio', () => {
    const definicion = /export\s+function\s+calcularSemaforo\s*\(/;
    const dominio = join(raiz, 'packages', 'domain', 'src', 'costos', 'semaforo.ts');
    expect(definicion.test(readFileSync(dominio, 'utf8'))).toBe(true);
    const fuera = archivos(join(raiz, 'backend', 'src'))
      .filter((ruta) => ruta.endsWith('.ts') && definicion.test(readFileSync(ruta, 'utf8')));
    expect(fuera).toEqual([]);
    const margen = archivos(join(raiz, 'backend', 'src'))
      .filter((ruta) => ruta.endsWith('.ts') && /calcularMargen/.test(readFileSync(ruta, 'utf8')));
    expect(margen).toEqual([]);
  });

  it('el DTO de tarjeta no incorpora margen ni costos derivados en C-10', async () => {
    const { dependencias } = crearDependenciasFalsas();
    const orden = crearOrden();
    const etapas = crearEtapas(['Corte', 'Soldadura'], orden.id);
    const tarjeta = construirTarjetaOrden(orden, etapas, await contextoTarjeta(dependencias));
    expect(Object.keys(tarjeta).some((clave) => /margen|costo|utilidad/i.test(clave))).toBe(false);
    expect(tarjeta.horasRealesTotales).toBe('0.00');
  });
});
