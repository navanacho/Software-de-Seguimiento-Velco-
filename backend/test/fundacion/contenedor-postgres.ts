import { PostgreSqlContainer } from '@testcontainers/postgresql';

export const IMAGEN_POSTGRES = 'postgres:18.7';

export function crearContenedorPostgres(): PostgreSqlContainer {
  return new PostgreSqlContainer(IMAGEN_POSTGRES);
}
