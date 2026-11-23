import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { leerConfiguracion } from '../../src/shared/configuracion.ts';

const raiz = resolve(process.cwd(), '..');
const leer = (ruta: string): string => readFileSync(join(raiz, ruta), 'utf8');

describe('entorno de desarrollo', () => {
  it('define PostgreSQL 18.7 con imagen fijada en Docker Compose', () => {
    const compose = leer('docker-compose.yml');
    expect(compose).toContain('image: postgres:18.7');
    expect(compose).toMatch(/\$\{POSTGRES_PORT:-5432\}:5432|5432:5432/);
    expect(compose).toContain('- velco_pgdata:/var/lib/postgresql');
    expect(compose).toContain('POSTGRES_DB');
    expect(compose).not.toMatch(/image:\s*postgres:(latest|14|15|16|17)\b/);
  });

  it('inicializa Prisma sin modelos de negocio ni columnas derivadas', () => {
    const esquema = leer('backend/prisma/schema.prisma');
    expect(esquema).toMatch(/datasource\s+db/);
    expect(esquema).toContain('provider = "postgresql"');
    expect(esquema).toMatch(/generator\s+client/);
    expect(esquema).toContain('provider = "prisma-client-js"');
    const modelos = esquema.match(/^model\s+\w+/gm) ?? [];
    expect(modelos).toEqual(['model Configuracion', 'model Cliente', 'model OrdenTrabajo', 'model MaterialOrden', 'model EtapaOrden', 'model RegistroHora']);
    for (const derivado of [
      /\bporcentaje_avance\b/,
      /\bhoras_totales\b/,
      /\bcosto_total\b/,
      /\bmargen\b/,
      /\bsemaforo\b/,
    ]) {
      expect(esquema).not.toMatch(derivado);
    }
    const configuracion = leer('backend/prisma.config.ts');
    expect(configuracion).toContain("env('DATABASE_URL')");
    expect(configuracion).toContain('schema:');
  });

  it('documenta las seis variables de entorno e ignora .env', () => {
    const ejemplo = leer('.env.example');
    for (const variable of ['DATABASE_URL', 'PORT', 'CORS_ORIGIN', 'TZ', 'EXCEL_TEMPLATES_DIR', 'EXCEL_UNC_BASE']) {
      expect(ejemplo, `${variable} falta en .env.example`).toContain(variable);
    }
    const ignore = leer('.gitignore');
    expect(ignore).toMatch(/^\.env$/m);
    expect(ignore).toContain('!.env.example');
  });

  it('resuelve la ruta UNC por configuración y no incorpora Python al runtime', () => {
    const ruta = '\\\\servidor\\g\\OPERACIONES\\OP - DIGITALIZADA\\';
    expect(leerConfiguracion({ EXCEL_UNC_BASE: ruta }).baseUncExcel).toBe(ruta);
    for (const manifiesto of ['package.json', 'backend/package.json', 'frontend/package.json', 'packages/domain/package.json']) {
      expect(leer(manifiesto)).not.toMatch(/python|openpyxl/i);
    }
    expect(leer('docker-compose.yml')).not.toMatch(/python/i);
  });
});
