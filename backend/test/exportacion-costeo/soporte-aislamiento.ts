import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

export interface ResultadoAislamiento {
  readonly exito: boolean;
  readonly salida: string;
  readonly adaptadoresPresentes: boolean;
  readonly fuentes: string;
}

function texto(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function salidaError(error: unknown): string {
  if (error !== null && typeof error === 'object') {
    const partes: string[] = [];
    const stdout = Reflect.get(error, 'stdout');
    const stderr = Reflect.get(error, 'stderr');
    if (typeof stdout === 'string') partes.push(stdout);
    if (typeof stderr === 'string') partes.push(stderr);
    if (partes.length > 0) return partes.join('\n');
  }
  return texto(error);
}

export function compilarDominioAislado(): ResultadoAislamiento {
  const raiz = resolve(process.cwd(), '..');
  const temporal = mkdtempSync(join(tmpdir(), 'velco-dominio-aislado-'));
  try {
    const paquete = join(temporal, 'packages', 'domain');
    mkdirSync(join(temporal, 'packages'), { recursive: true });
    cpSync(join(raiz, 'packages', 'domain', 'src'), join(paquete, 'src'), { recursive: true });
    cpSync(join(raiz, 'tsconfig.base.json'), join(temporal, 'tsconfig.base.json'));
    writeFileSync(
      join(paquete, 'tsconfig.json'),
      `${JSON.stringify(
        {
          extends: '../../tsconfig.base.json',
          compilerOptions: { types: [] },
          include: ['src/**/*.ts'],
          exclude: ['src/**/*.test.ts'],
        },
        null,
        2,
      )}\n`,
    );

    const tsc = join(raiz, 'node_modules', 'typescript', 'bin', 'tsc');
    execFileSync(process.execPath, [tsc, '--noEmit', '-p', join(paquete, 'tsconfig.json')], {
      cwd: temporal,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    return {
      exito: true,
      salida: '',
      adaptadoresPresentes: existsSync(join(temporal, 'backend', 'src', 'features', 'exportacion', 'excel')),
      fuentes: readFileSync(join(paquete, 'src', 'exportacion', 'modelo.ts'), 'utf8'),
    };
  } catch (error) {
    return {
      exito: false,
      salida: salidaError(error),
      adaptadoresPresentes: existsSync(join(temporal, 'backend', 'src', 'features', 'exportacion', 'excel')),
      fuentes: '',
    };
  } finally {
    rmSync(temporal, { recursive: true, force: true });
  }
}
