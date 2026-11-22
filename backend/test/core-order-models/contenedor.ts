import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { crearContenedorPostgres } from '../fundacion/contenedor-postgres.ts';

const raiz = resolve(process.cwd(), '..');
const directorioBackend = join(raiz, 'backend');
const rutaMigracion001 = join(directorioBackend, 'prisma', 'migrations', '001_core_order_models', 'migration.sql');
const rutaCliPrisma = join(raiz, 'node_modules', 'prisma', 'build', 'index.js');
const rutaSeed = join(directorioBackend, 'prisma', 'seed.ts');

export function hayDocker(): boolean {
  try {
    execFileSync('docker', ['info'], { stdio: 'ignore', timeout: 10_000 });
    return true;
  } catch {
    return false;
  }
}

export interface BaseDeTest {
  prisma: PrismaClient;
  uri: string;
}

function ejecutar(args: string[], entorno: NodeJS.ProcessEnv): void {
  execFileSync(process.execPath, args, {
    cwd: directorioBackend,
    env: entorno,
    stdio: 'pipe',
    timeout: 120_000,
  });
}

export async function conBase<T>(accion: (base: BaseDeTest) => Promise<T>): Promise<T> {
  const iniciado = await crearContenedorPostgres().start();
  let prisma: PrismaClient | undefined;
  try {
    const uri = iniciado.getConnectionUri();
    if (existsSync(rutaMigracion001)) {
      const entorno = { ...process.env, DATABASE_URL: uri };
      ejecutar([rutaCliPrisma, 'migrate', 'deploy'], entorno);
      ejecutar(['--experimental-strip-types', rutaSeed], entorno);
    }
    const adapter = new PrismaPg({ connectionString: uri });
    prisma = new PrismaClient({ adapter });
    return await accion({ prisma, uri });
  } finally {
    await prisma?.$disconnect();
    await iniciado.stop();
  }
}
