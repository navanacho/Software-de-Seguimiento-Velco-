import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const raiz = resolve(process.cwd(), '..');
const dominio = join(raiz, 'packages', 'domain');

function archivosFuente(directorio: string): string[] {
  const entradas = readdirSync(directorio, { withFileTypes: true });
  return entradas.flatMap((entrada) => {
    const ruta = join(directorio, entrada.name);
    return entrada.isDirectory() ? archivosFuente(ruta) : ruta.endsWith('.ts') ? [ruta] : [];
  });
}

describe('aislamiento del paquete de dominio', () => {
  it('no importa Fastify, Prisma, React ni exceljs y no usa any', () => {
    const prohibidas = ['fastify', '@prisma/client', 'prisma', 'react', 'exceljs'];
    for (const archivo of archivosFuente(join(dominio, 'src'))) {
      const contenido = readFileSync(archivo, 'utf8');
      for (const dependencia of prohibidas) {
        expect(contenido, `${archivo} importa ${dependencia}`).not.toMatch(new RegExp(`from ['"]${dependencia}`));
      }
      expect(contenido, `${archivo} usa any`).not.toMatch(/:\s*any\b|\bas\s+any\b/);
    }
  });

  it('compila de forma aislada sin dependencias de framework', () => {
    const temporal = mkdtempSync(join(tmpdir(), 'velco-dominio-'));
    try {
      cpSync(dominio, temporal, { recursive: true });
      const tsc = join(raiz, 'node_modules', 'typescript', 'bin', 'tsc');
      try {
        execFileSync(
          process.execPath,
          [
            tsc,
            '--noEmit',
            '--ignoreConfig',
            '--strict',
            '--target',
            'ES2023',
            '--module',
            'ESNext',
            '--moduleResolution',
            'Bundler',
            '--allowImportingTsExtensions',
            '--verbatimModuleSyntax',
            '--skipLibCheck',
            join(temporal, 'src', 'index.ts'),
            join(temporal, 'src', 'salud', 'contrato.ts'),
          ],
          { stdio: 'pipe' },
        );
      } catch (error) {
        const fallo = error as { stderr?: Buffer; stdout?: Buffer };
        const salida = [fallo.stdout?.toString(), fallo.stderr?.toString()].filter(Boolean).join('\n') || 'sin salida';
        throw new Error(`la compilación aislada falló: ${salida}`);
      }
    } finally {
      rmSync(temporal, { recursive: true, force: true });
    }
  });

  it('no depende de los adaptadores por feature', () => {
    const configuracion = JSON.parse(readFileSync(join(dominio, 'tsconfig.json'), 'utf8')) as {
      include: string[];
    };
    expect(configuracion.include).toEqual(['src/**/*.ts']);
    for (const archivo of archivosFuente(join(dominio, 'src'))) {
      expect(readFileSync(archivo, 'utf8')).not.toMatch(/backend\/|\.\.\/\.\.\/backend/);
    }
  });
});
