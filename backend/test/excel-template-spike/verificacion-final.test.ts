import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { listarArchivosSpike } from './soporte';

const raiz = resolve(process.cwd(), '..');
const rutaCambioArchivado = join(
  raiz,
  'openspec',
  'changes',
  'archive',
  '2026-11-26-excel-template-spike',
);
const rutaADR = join(rutaCambioArchivado, 'adr', 'estrategia-escritura-excel.md');
const rutaReporte = join(rutaCambioArchivado, 'verify-report.md');
const rutaTests = join(raiz, 'backend', 'test', 'excel-template-spike');

function sinRutaPreArchive(nombreArchivo: string): boolean {
  const fuente = readFileSync(join(rutaTests, nombreArchivo), 'utf8');
  const nombreViejo = ['excel', 'template', 'spike'].join('-');
  const rutaPlana = ['openspec', 'changes', nombreViejo].join('/');
  const patronSegmentos = new RegExp(`['"]changes['"]\\s*,\\s*['"]${nombreViejo}['"]`);

  return !fuente.includes(rutaPlana) && !patronSegmentos.test(fuente);
}

function archivosTs(directorio: string): string[] {
  return readdirSync(directorio, { withFileTypes: true }).flatMap((entrada) => {
    const ruta = join(directorio, entrada.name);
    if (entrada.isDirectory()) {
      return archivosTs(ruta);
    }
    return ruta.endsWith('.ts') ? [ruta] : [];
  });
}

describe('verificación final del apply sin build', () => {
  it('10.2 aísla packages/domain de frameworks y de any', () => {
    const archivos = archivosTs(join(raiz, 'packages', 'domain', 'src'));
    const prohibidas = [
      "from 'exceljs'",
      "from 'fastify'",
      "from '@prisma/client'",
      "from 'react'",
    ];

    expect(archivos.length).toBeGreaterThan(0);
    for (const archivo of archivos) {
      const contenido = readFileSync(archivo, 'utf8');
      expect(contenido, `${archivo} usa any`).not.toMatch(/:\s*any\b|\bas\s+any\b/);
      for (const dependencia of prohibidas) {
        expect(contenido, `${archivo} importa ${dependencia}`).not.toContain(dependencia);
      }
    }
  });

  it('10.2 el adaptador del spike tampoco usa any ni dependencias de framework', () => {
    const rutaAdaptador = join(raiz, 'backend', 'src', 'features', 'exportacion', 'excel');
    const archivos = listarArchivosSpike().filter((archivo) => archivo.startsWith(rutaAdaptador));

    expect(archivos.length).toBeGreaterThan(0);
    for (const archivo of archivos) {
      const contenido = readFileSync(archivo, 'utf8');
      expect(contenido, `${archivo} usa any`).not.toMatch(/:\s*any\b|\bas\s+any\b/);
      expect(contenido, `${archivo} importa exceljs`).not.toContain("from 'exceljs'");
    }
  });

  it('10.4 no queda exceljs como mecanismo de escritura', () => {
    const fuentes = [
      ...listarArchivosSpike(),
      rutaADR,
      rutaReporte,
    ];
    const patronesEscritura = [
      /writeFile\s*\(/,
      /writeBuffer\s*\(/,
      /new ExcelJS\.Workbook\s*\(/,
      /crearWorkbook\s*\(/,
    ];

    for (const fuente of fuentes) {
      const contenido = readFileSync(fuente, 'utf8');
      for (const patron of patronesEscritura) {
        expect(contenido, `${fuente} contiene ${patron.source}`).not.toMatch(patron);
      }
    }
    expect(readFileSync(rutaADR, 'utf8')).toContain('`exceljs` 4.4.0 solo para lectura y verificación');
  });

  it('10.4 no queda la atribución errónea del enlace grande a costeo', () => {
    const adr = readFileSync(rutaADR, 'utf8');
    const lineasSospechosas = adr
      .split(/\r?\n/)
      .filter((linea) => /577\.125/i.test(linea) && /costeo/i.test(linea));

    expect(adr).toContain('577.125 B en OP');
    expect(adr).toContain('994 B en costeo');
    expect(lineasSospechosas.length).toBeGreaterThan(0);
    for (const linea of lineasSospechosas) {
      expect(linea, 'toda mención conjunta debe ser una corrección explícita').toMatch(
        /errónea|no pertenece|CORREGIDA/i,
      );
    }
  });

  it('C-13 archive: el ADR se lee desde archive y su test no apunta a la ruta pre-archive', () => {
    const rutaADRArchivado = join(rutaCambioArchivado, 'adr', 'estrategia-escritura-excel.md');
    expect(existsSync(rutaADRArchivado)).toBe(true);
    expect(readFileSync(rutaADRArchivado, 'utf8')).toContain('## Decisión');
    expect(sinRutaPreArchive('adr.test.ts')).toBe(true);
  });

  it('C-13 archive: verify-report.md se lee desde archive y su test no apunta a la ruta pre-archive', () => {
    const rutaReporteArchivado = join(rutaCambioArchivado, 'verify-report.md');
    expect(existsSync(rutaReporteArchivado)).toBe(true);
    expect(readFileSync(rutaReporteArchivado, 'utf8')).toContain(
      '**READY FOR ARCHIVE / compuerta cumplida**',
    );
    expect(sinRutaPreArchive('verify-report.test.ts')).toBe(true);
    expect(sinRutaPreArchive('adr.test.ts')).toBe(true);
  });

  it('C-13 archive: .openspec.yaml existe y validate-cli.test.ts usa la ruta archivada', () => {
    const rutaYamlArchivado = join(rutaCambioArchivado, '.openspec.yaml');
    const fuenteValidate = readFileSync(join(rutaTests, 'validate-cli.test.ts'), 'utf8');
    expect(existsSync(rutaYamlArchivado)).toBe(true);
    expect(readFileSync(rutaYamlArchivado, 'utf8')).toContain('schema: spec-driven');
    expect(fuenteValidate).toContain('2026-11-26-excel-template-spike');
    expect(sinRutaPreArchive('verificacion-final.test.ts')).toBe(true);
  });
});
