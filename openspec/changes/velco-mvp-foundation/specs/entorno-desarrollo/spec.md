## ADDED Requirements

### Requirement: PostgreSQL de desarrollo en Docker Compose

El repositorio DEBE (SHALL) incluir `docker-compose.yml` con un servicio PostgreSQL 18.7 (imagen `postgres:18.7`) para desarrollo local sobre Docker Desktop. PostgreSQL 14 quedó EOL el 2026-11-12.

#### Scenario: Levantar el entorno

- **WHEN** se ejecuta el comando de Docker Compose para iniciar los servicios
- **THEN** PostgreSQL 18.7 queda disponible para la cadena `DATABASE_URL` del backend

#### Scenario: Versión fijada del contenedor

- **WHEN** se inspecciona `docker-compose.yml`
- **THEN** la imagen declarada es `postgres:18.7`, sin tags flotantes ni versiones mínimas ambiguas

### Requirement: Esquema Prisma inicializado sin modelos de negocio

`backend/prisma/schema.prisma` DEBE (SHALL) contener `datasource` apuntando a PostgreSQL y `generator` de Prisma 7.10.1 (cliente y CLI), y NO DEBE definir modelos de negocio ni columnas derivadas como avance, totales de horas, costos, margen o semáforo. No se usa Prisma 8.0.0-rc.34 por ser release candidate.

#### Scenario: Inspección del esquema

- **WHEN** se abre `backend/prisma/schema.prisma`
- **THEN** solo están presentes `datasource`, `generator` y la configuración necesaria, sin modelos `ordenes_trabajo`, `clientes`, `etapas_orden` ni derivados persistidos

#### Scenario: Generador fijado

- **WHEN** se inspecciona el bloque `generator` del esquema
- **THEN** declara Prisma 7.10.1 como versión exacta del cliente y de la CLI

### Requirement: Configuración por variables de entorno

`.env.example` DEBE (SHALL) documentar `DATABASE_URL`, `PORT`, `CORS_ORIGIN`, `TZ`, `EXCEL_TEMPLATES_DIR` y `EXCEL_UNC_BASE`; el archivo `.env` DEBE estar ignorado por git y `DATABASE_URL` NO DEBE versionarse.

#### Scenario: Plantilla de entorno completa

- **WHEN** se inspecciona `.env.example`
- **THEN** las seis variables indicadas están presentes con valores de ejemplo no sensibles

#### Scenario: Ruta UNC configurada

- **WHEN** se necesita acceder a la ruta UNC histórica de plantillas u OP digitalizadas
- **THEN** la ruta se obtiene de `EXCEL_UNC_BASE` y no se escribe literalmente en el código

### Requirement: Ejecución en host Windows sin Python

Node/Fastify y el proceso de exportación DEBEN (SHALL) ejecutarse en el host Windows de modo que las rutas UNC se resuelvan nativamente; PostgreSQL DEBE ejecutarse en Docker Desktop. NO DEBE incorporarse Python al runtime.

#### Scenario: Arranque del sistema

- **WHEN** se ejecutan la API y el exportador en el entorno de desarrollo
- **THEN** lo hacen en el host Windows con Node.js 26.13.1, sin dependencias de Python y con PostgreSQL 18.7 en contenedor

### Requirement: Fijación exacta de versiones del entorno

Los manifiestos DEBEN (SHALL) fijar las versiones exactas verificadas el 2026-11-19 y documentar que superan los mínimos históricos del stack (React 18+, Vite 5+, TypeScript 5+, Fastify 4+, Prisma 5+, PostgreSQL 14+, Vitest 1+); NO DEBEN usar release candidates.

#### Scenario: Revisión de manifiestos

- **WHEN** se inspeccionan los manifiestos del workspace
- **THEN** figuran Node.js 26.13.1, TypeScript 7.0.2, React 19.3.1, Vite 8.3.8, Fastify 5.12.8, Prisma 7.10.1, PostgreSQL 18.7, `exceljs` 4.4.0, Vitest 5.1.1, `@tanstack/react-query` 5.108.1, `react-router-dom` 7.18.6, `clsx` 2.1.1, `zod` 4.6.7, `@fastify/swagger` 9.9.5, `@testcontainers/postgresql` 12.2.2, `@testing-library/react` 16.3.3, `jsdom` 31.0.1, `@types/node` 26.6.6, `@types/react` 19.3.0 y `@types/react-dom` 19.3.0

#### Scenario: Dependencia de runtime fijada

- **WHEN** se requiere una dependencia del stack
- **THEN** se instala la versión exacta listada y no una versión mínima ni un release candidate como Prisma 8.0.0-rc.34
