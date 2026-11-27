import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ejecutarValidacionOpenSpec } from '../../src/features/exportacion/excel/validacion';

const raiz = resolve(process.cwd(), '..');
const cambio = 'excel-template-spike';
const rutaCambioArchivado = join(raiz, 'openspec', 'changes', 'archive', '2026-11-26-excel-template-spike');

function espacioAislado(): string {
  const destino = mkdtempSync(join(tmpdir(), 'velco-openspec-validate-'));
  mkdirSync(join(destino, 'openspec', 'changes', cambio), { recursive: true });
  cpSync(join(raiz, 'openspec', 'config.yaml'), join(destino, 'openspec', 'config.yaml'));
  cpSync(
    join(rutaCambioArchivado, '.openspec.yaml'),
    join(destino, 'openspec', 'changes', cambio, '.openspec.yaml'),
  );
  for (const archivo of ['proposal.md', 'design.md', 'tasks.md']) {
    cpSync(
      join(rutaCambioArchivado, archivo),
      join(destino, 'openspec', 'changes', cambio, archivo),
    );
  }
  cpSync(
    join(rutaCambioArchivado, 'specs'),
    join(destino, 'openspec', 'changes', cambio, 'specs'),
    { recursive: true },
  );
  cpSync(join(raiz, 'openspec', 'specs'), join(destino, 'openspec', 'specs'), { recursive: true });
  return destino;
}

describe('gate de validación OpenSpec aislado del repositorio', () => {
  it('8.7 acepta el change válido y los specs válidos', () => {
    const directorio = espacioAislado();
    try {
      const resultadoChange = ejecutarValidacionOpenSpec(
        ['validate', cambio, '--strict'],
        directorio,
      );
      const resultadoSpecs = ejecutarValidacionOpenSpec(
        ['validate', '--specs', '--strict'],
        directorio,
      );

      expect(resultadoChange.codigo).toBe(0);
      expect(resultadoChange.salida).toContain(`Change '${cambio}' is valid`);
      expect(resultadoSpecs.codigo).toBe(0);
      expect(resultadoSpecs.salida).toMatch(/Totals: \d+ passed, 0 failed \(\d+ items\)/);
    } finally {
      rmSync(directorio, { recursive: true, force: true });
    }
  });

  it('8.7 detecta un delta inválido sin tocar el repositorio', () => {
    const directorio = espacioAislado();
    try {
      const rutaSpec = join(
        directorio,
        'openspec',
        'changes',
        cambio,
        'specs',
        'excel-spike-adricion',
        'spec.md',
      );
      const contenidoOriginal = readFileSync(rutaSpec, 'utf8');
      expect(contenidoOriginal).toContain('### Requirement:');
      writeFileSync(rutaSpec, contenidoOriginal.replaceAll('### Requirement:', '### Requisito:'));

      const resultado = ejecutarValidacionOpenSpec(['validate', cambio, '--strict'], directorio);

      expect(resultado.codigo).toBe(1);
      expect(resultado.salida).toContain('no requirement entries parsed');
      expect(readFileSync(join(rutaCambioArchivado, 'specs', 'excel-spike-adricion', 'spec.md'), 'utf8')).toContain('### Requirement:');
    } finally {
      rmSync(directorio, { recursive: true, force: true });
    }
  });

  it('8.7 detecta una spec principal inválida en el espacio aislado', () => {
    const directorio = espacioAislado();
    try {
      const carpeta = join(directorio, 'openspec', 'specs', 'invalido-prueba');
      mkdirSync(carpeta, { recursive: true });
      writeFileSync(join(carpeta, 'spec.md'), 'contenido sin encabezados');

      const resultado = ejecutarValidacionOpenSpec(['validate', '--specs', '--strict'], directorio);

      expect(resultado.codigo).toBe(1);
      expect(resultado.salida).toContain('spec/invalido-prueba');
      expect(resultado.salida).toMatch(/1 failed/);
    } finally {
      rmSync(directorio, { recursive: true, force: true });
    }
  });
});
