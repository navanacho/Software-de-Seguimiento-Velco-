## 1. Workspace, versiones y decisiones canónicas

- [ ] 1.1 Crear la estructura de workspace feature-based: `packages/domain/src/<feature>/`, `backend/src/features/<feature>/{application,http,prisma,excel}`, `backend/src/shared/`, `frontend/src/features/<feature>/{components,hooks,queries}`, `frontend/src/shared/`, `frontend/src/app/` y `frontend/src/global.css`, con los scripts raíz de gestión
- [ ] 1.2 Fijar versiones exactas en los manifiestos (verificadas el 2026-11-19; superan los mínimos históricos y se evita RC): Node.js 26.13.1 (LTS activo; Node 20 EOL desde 2026-04-30), TypeScript 7.0.2, React 19.3.1, Vite 8.3.8, Fastify 5.12.8, Prisma 7.10.1 (cliente y CLI; NO 8.0.0-rc.34 por ser release candidate), PostgreSQL 18.7 (PG14 EOL desde 2026-11-12; imagen `postgres:18.7`), `exceljs` 4.4.0, Vitest 5.1.1, `@tanstack/react-query` 5.108.1, `react-router-dom` 7.18.6, `clsx` 2.1.1, `zod` 4.6.7, `@fastify/swagger` 9.9.5, `@testcontainers/postgresql` 12.2.2, `@testing-library/react` 16.3.3, `jsdom` 31.0.1, `@types/node` 26.6.6, `@types/react` 19.3.0 y `@types/react-dom` 19.3.0
- [ ] 1.3 Crear un `tsconfig` base estricto heredado por backend, frontend y `packages/domain`, sin `any`
- [ ] 1.4 Registrar DD-01…DD-10 como ADR versionados con contexto, decisión, alternativas, justificación y trade-offs
- [ ] 1.5 Declarar IN-08 y DD-07 como riesgos abiertos con decisor y siguiente change/fase, sin resolverlos silenciosamente; registrar IN-09 como RESUELTA por el usuario (docs obsoletos borrados deliberadamente, sin recuperación desde git, sin ZIP ni PIN como requisitos) y acotar roles a HU-19 en Fase 2 (R5)

## 2. Base de testing (R1, R10)

- [ ] 2.1 Configurar Vitest 5.1.1 en `backend/` y `frontend/` con `@testing-library/react` 16.3.3, `jsdom` 31.0.1, scripts de ejecución y `tsconfig` estricto
- [ ] 2.2 Escribir los tests de smoke fallidos del health check y de la configuración de Vitest antes de implementar (RED)
- [ ] 2.3 Preparar PostgreSQL real en contenedor con `@testcontainers/postgresql` 12.2.2 para tests de integración, sin mocks de Prisma ni de la base de datos

## 3. Paquete de dominio compartido

- [ ] 3.1 Escribir el test fallido que exige un tipo/contrato compartido importable desde `backend/` y `frontend/` (RED)
- [ ] 3.2 Crear `packages/domain/src/<feature>/` con el contrato mínimo y referenciarlo desde ambos proyectos (GREEN)
- [ ] 3.3 Agregar un segundo caso de importación y refactorizar sin duplicar definiciones (TRIANGULATE/REFACTOR)
- [ ] 3.4 Verificar compilación aislada del paquete sin Fastify, Prisma, React ni `exceljs`, y sin `any` (R2, R9)

## 4. Backend Fastify feature-based

- [ ] 4.1 Implementar el mínimo para que el smoke de `GET /api/health` responda 200 con estado `ok` leyendo `PORT` y `CORS_ORIGIN` (GREEN)
- [ ] 4.2 Agregar el segundo caso del health check (puerto configurable) y refactorizar el handler (TRIANGULATE/REFACTOR)
- [ ] 4.3 Crear `backend/src/features/<feature>/{application,http,prisma,excel}`, `backend/src/shared/` y `main.ts` sin reglas de negocio en adaptadores; no crear `infrastructure/`
- [ ] 4.4 Verificar que al eliminar TODOS los adaptadores por feature (`backend/src/features/*/prisma`, `backend/src/features/*/excel` y `backend/src/features/*/http`), `packages/domain/` sigue compilando (R2)
- [ ] 4.5 Verificar ausencia de importaciones de Fastify, Prisma, React y `exceljs` en `packages/domain/src/`

## 5. Frontend Vite + React + TypeScript

- [ ] 5.1 Implementar el mínimo para que arranque la SPA con Vite 8.3.8, React 19.3.1 y TypeScript 7.0.2 y pase el smoke de Vitest (GREEN)
- [ ] 5.2 Agregar un segundo caso de smoke y refactorizar el punto de entrada (TRIANGULATE/REFACTOR)
- [ ] 5.3 Configurar `@tanstack/react-query` 5.108.1 para server state y `react-router-dom` 7.18.6 para routing, con versiones fijadas
- [ ] 5.4 Configurar CSS Modules nativos de Vite, un único `frontend/src/global.css` para reset/variables y clases condicionales con `clsx` 2.1.1 o template strings, sin Tailwind
- [ ] 5.5 Verificar componentes en PascalCase, sin `any`, sin cálculo de derivados y sin slider de avance ni columnas Kanban (R9)

## 6. Entorno de desarrollo y persistencia inicial

- [ ] 6.1 Crear `docker-compose.yml` con PostgreSQL 18.7 (imagen `postgres:18.7`) para desarrollo en Docker Desktop
- [ ] 6.2 Inicializar `backend/prisma/schema.prisma` con `datasource` PostgreSQL y `generator` de Prisma 7.10.1, sin modelos de negocio ni columnas derivadas (R3)
- [ ] 6.3 Crear `.env.example` con `DATABASE_URL`, `PORT`, `CORS_ORIGIN`, `TZ`, `EXCEL_TEMPLATES_DIR` y `EXCEL_UNC_BASE`, e ignorar `.env` en git
- [ ] 6.4 Verificar ejecución en host Windows con PostgreSQL en contenedor, ruta UNC leída desde `EXCEL_UNC_BASE` y ausencia de Python en runtime (R4)

## 7. Verificación y cierre del change

- [ ] 7.1 Ejecutar los tests de smoke de ambos proyectos y comprobar el ciclo RED → GREEN → TRIANGULATE → REFACTOR con al menos dos casos por regla
- [ ] 7.2 Verificar que no se crearon reglas de negocio, modelos de dominio, migraciones, código de auth/PIN/RBAC ni archivos `.xlsx`; Taller sin montos y costos/márgenes solo para Admin/Oficina en HU-19 de Fase 2 (R5, R6)
- [ ] 7.3 Ejecutar `openspec validate velco-mvp-foundation --strict`, confirmar `openspec status --change velco-mvp-foundation --json` en estado aplicable y gestionar `openspec/` solo por CLI (R8)
