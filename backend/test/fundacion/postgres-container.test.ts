import { execFileSync } from 'node:child_process';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { describe, expect, it } from 'vitest';
import { IMAGEN_POSTGRES, crearContenedorPostgres } from './contenedor-postgres.ts';

function hayDocker(): boolean {
  try {
    execFileSync('docker', ['info'], { stdio: 'ignore', timeout: 10_000 });
    return true;
  } catch {
    return false;
  }
}

describe('PostgreSQL real para tests de integración', () => {
  it('configura el contenedor con la imagen fijada postgres:18.7', () => {
    expect(IMAGEN_POSTGRES).toBe('postgres:18.7');
    expect(crearContenedorPostgres()).toBeInstanceOf(PostgreSqlContainer);
  });

  it.skipIf(!hayDocker())('levanta PostgreSQL 18.7 real sin mocks', async () => {
    const contenedor = crearContenedorPostgres();
    const iniciado = await contenedor.start();
    try {
      expect(iniciado.getMappedPort(5432)).toBeGreaterThan(0);
      expect(iniciado.getConnectionUri()).toMatch(/^postgres(ql)?:\/\//);
    } finally {
      await iniciado.stop();
    }
  }, 180_000);
});
