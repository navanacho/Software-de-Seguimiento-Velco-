import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const raiz = resolve(process.cwd(), '..');
const cambio = ['openspec', 'changes', 'exportacion-costeo'];

function leer(...segmentos: string[]): string {
  return readFileSync(join(raiz, ...cambio, ...segmentos), 'utf8');
}

function filaPregunta(diseno: string, id: 'Q2' | 'Q3'): string {
  const fila = diseno.split(/\r?\n/).find((linea) => linea.startsWith(`| ${id} |`));
  if (fila === undefined) throw new Error(`falta la fila ${id} en Open Questions`);
  return fila;
}

function decision(diseno: string, id: 'D2' | 'D6' | 'D7'): string {
  const fila = diseno.split(/\r?\n/).find((linea) => linea.startsWith(`- **${id} `));
  if (fila === undefined) throw new Error(`falta la decisión ${id} en design.md`);
  return fila;
}

describe('corrección de alcance: sólo hoja 1 en C-14 (inventario y diseño)', () => {
  const inventario = leer('inventario-celdas.md');
  const diseno = leer('design.md');

  it('el inventario no describe las cinco hojas como copias y declara la hoja 1 como único alcance automatizado', () => {
    expect(inventario).not.toMatch(/idénticas celda a celda/i);
    expect(inventario).not.toMatch(/las cinco son idénticas/i);
    expect(inventario).toMatch(/hojas `1`\.\.`5` son distintas/i);
    expect(inventario).toContain('único alcance automatizado');
    expect(inventario).toContain('`sheet2.xml`');
  });

  it('el inventario confirma por usuario las cuatro decisiones y conserva la prueba SHA-256', () => {
    expect(inventario.match(/confirmada por el usuario/g)?.length ?? 0).toBeGreaterThanOrEqual(4);
    expect(inventario).toContain('1FA2DA0031D2A06BBAC506057F3679D77CA835D1EB70B8657F19D95A47649602');
    expect(inventario).toContain('SHA-256 después');
    expect(inventario).toContain('la plantilla oficial NO fue modificada');
  });

  it('el inventario mantiene la fila concreta de GENERAL como incierta, manual y fuera de alcance', () => {
    const filaGeneral = inventario.split(/\r?\n/).find((linea) => linea.includes('`A4:A43`'));
    expect(filaGeneral).toBeDefined();
    expect(filaGeneral).toMatch(/incierta/i);
    expect(filaGeneral).toMatch(/manual/i);
    expect(filaGeneral).toMatch(/fuera de alcance/i);
  });

  it('el inventario distingue P13 canónica de R10 espejo y declara todas las celdas económicas', () => {
    const filas = inventario.split(/\r?\n/);
    const fila = (texto: string): string => {
      const encontrada = filas.find((linea) => linea.includes(texto));
      if (encontrada === undefined) throw new Error(`falta la fila ${texto} en el inventario`);
      return encontrada;
    };

    expect(fila('| `P13` |')).toContain('canónica');
    expect(fila('| `R10` |')).toContain('espejo neutralizado');
    expect(fila('| `Q13:Q21` |')).toContain('`valorHora`');
    expect(fila('| `Q13:Q21` |')).not.toContain('`32` (numérico fijo');
    expect(fila('| `R39`, `R40:R58`, `R59` |')).toContain('`materiales.{i}.costoTotal`');
    expect(fila('| `R39`, `R40:R58`, `R59` |')).toContain('`costos.costoMaterialesReal`');
    expect(fila('| `R39`, `R40:R58`, `R59` |')).toContain('inferida de fórmula');
  });

  it('D2 restringe el descriptor a sheet2.xml y preserva byte-a-byte el resto', () => {
    const d2 = decision(diseno, 'D2');
    expect(d2).toContain('`xl/worksheets/sheet2.xml`');
    expect(d2).toContain('byte-a-byte');
    expect(d2).toMatch(/MANUAL/i);
    expect(d2).toMatch(/NO constituye fallo CRITICAL de la compuerta automática/i);
  });

  it('D6 y D7 reflejan prefijo de tipo, horasReales en TOTAL horas y firma obligatoria', () => {
    const d6 = decision(diseno, 'D6');
    const d7 = decision(diseno, 'D7');
    expect(d6).toContain('`[MP]`');
    expect(d6).toContain('`[INSUMOS]`');
    expect(d6).toContain('`[TERCERIZADOS]`');
    expect(d6).toContain('un material por fila');
    expect(d6).toContain('sin inserciones estructurales');
    expect(d6).toContain('`TOTAL horas`');
    expect(d6).toMatch(/horasVendidas/i);
    expect(d7).toContain('firma humana');
    expect(d7).toMatch(/NO constituye fallo CRITICAL de la compuerta automática/i);
  });

  it('Q2 y Q3 quedan RESUELTAS con las cuatro decisiones y habilitan 1.4 y 1.5', () => {
    const q2 = filaPregunta(diseno, 'Q2');
    const q3 = filaPregunta(diseno, 'Q3');
    expect(q2).toContain('RESUELTA');
    expect(q2).toContain('confirmada por el usuario');
    expect(q3).toContain('RESUELTA');
    expect(q3).toContain('confirmada por el usuario');
    expect(q2).not.toMatch(/pendiente/i);
    expect(q3).not.toMatch(/pendiente/i);
    expect(diseno).toMatch(/tareas 1\.4 y 1\.5/);
  });
});
