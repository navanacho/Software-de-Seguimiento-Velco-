## Why

Velco SRL aún no tiene una base técnica ni un conjunto de decisiones congeladas sobre las cuales apoyar el MVP de seguimiento de órdenes de producción: sin stack fijado, sin esqueleto feature-based y sin entorno reproducible, cada change posterior (C-02 en adelante) duplicaría tipos, reglas o configuración. Este change establece esa fundación y registra DD-01…DD-10 antes de escribir código de negocio.

## What Changes

- Registrar DD-01…DD-10 como ADR versionados: stack Opción B con versiones exactas, esquema canónico, auth diferida, Excel sobre plantillas, avance derivado y exportación por OP. Quedan documentados como riesgos abiertos IN-08 (enlace ~577 KB y ruta UNC) y DD-07 (aprobación humana para auth), sin resolverlos silenciosamente; IN-09 queda RESUELTA por el usuario: `Docs/MVP.md` y `Docs/HistoriasDeUsuario.md` se borraron deliberadamente por obsoletos y la documentación vigente es la fuente, sin recuperar documentos de git ni usar ZIP o PIN como requisitos.
- Crear el esqueleto feature-based de `backend/` con Fastify 5.12.8 y `GET /api/health`, con `features/<feature>/{application,http,prisma,excel}` y `shared/`, sin lógica de negocio ni capa `infrastructure/` central.
- Crear el esqueleto feature-based de `frontend/` con Vite 8.3.8, React 19.3.1 y TypeScript 7.0.2, con `features/<feature>/{components,hooks,queries}`, `shared/`, `app/` y un único `global.css`, CSS Modules nativos de Vite, TanStack Query y React Router. Tailwind queda descartado.
- Fijar las versiones exactas de todas las dependencias en los manifiestos (verificadas el 2026-11-19; superan los mínimos históricos del stack y evitan release candidates) y habilitar `tsconfig` estricto sin `any` (R9).
- Crear el paquete de workspace `packages/domain/src/<feature>/` para que web y API no dupliquen tipos ni reglas puras, manteniendo el dominio libre de frameworks (R2); al eliminar TODOS los adaptadores por feature debe seguir compilando.
- Agregar `docker-compose.yml` con PostgreSQL 18.7 (imagen `postgres:18.7`) para desarrollo; inicializar `backend/prisma/schema.prisma` con Prisma 7.10.1 solo con `datasource` y `generator`, sin modelos de negocio.
- Agregar `.env.example` con `DATABASE_URL`, `PORT`, `CORS_ORIGIN`, `TZ`, `EXCEL_TEMPLATES_DIR` y `EXCEL_UNC_BASE`; `.env` ignorado por git.
- Configurar Vitest 5.1.1 en `backend/` y `frontend/` con `@testing-library/react` 16.3.3 y `jsdom` 31.0.1, con tests de smoke (health check y configuración de Vitest) ejecutables antes de cualquier implementación, con ciclo RED → GREEN → TRIANGULATE → REFACTOR (R1).
- Fuera de alcance: código de aplicación de negocio, modelos Prisma de dominio, autenticación/PIN/RBAC (R5, requiere aprobación humana), roles completos (solo HU-19 en Fase 2: Admin/Oficina ve costos y márgenes; Taller sin montos), exportación consolidada en ZIP, tarifas por etapa, HTTPS/reverse proxy y backups.

## Capabilities

### New Capabilities

- `decisiones-arquitectonicas`: registro versionado de DD-01…DD-10 como ADR, con trazabilidad al roadmap, IN-09 resuelta como decisión y declaración explícita de los riesgos abiertos restantes y decisiones diferidas.
- `fundacion-backend`: esqueleto Fastify 5.12.8 de `backend/`, health check y separación feature-based con puertos y adaptadores por feature, sin reglas de negocio.
- `paquete-dominio-compartido`: paquete de workspace de TypeScript puro con reglas por feature en `packages/domain/src/<feature>/`, sin dependencias de framework.
- `fundacion-frontend`: esqueleto Vite 8.3.8 + React 19.3.1 + TypeScript 7.0.2, organizado en features, con CSS Modules y `global.css`, TanStack Query y React Router.
- `entorno-desarrollo`: Docker Compose con PostgreSQL 18.7, esquema Prisma 7.10.1 inicializado sin modelos, versiones fijadas y configuración por variables de entorno con `.env` ignorado.
- `fundacion-testing`: Vitest 5.1.1 configurado en ambos proyectos con tests de smoke previos a la implementación y disciplina TDD estricta.

### Modified Capabilities

Ninguna. `openspec list --specs` no reporta specs existentes, por lo que no hay requisitos de capabilities vigentes que modificar.

## Impact

- Estructura nueva: `backend/src/features/<feature>/{application,http,prisma,excel}`, `backend/src/shared/`, `frontend/src/features/<feature>/{components,hooks,queries}`, `frontend/src/shared/`, `frontend/src/app/`, `frontend/src/global.css`, `packages/domain/src/<feature>/`, `docker-compose.yml`, `.env.example` y `.gitignore`.
- Dependencias nuevas fijadas: Node.js 26.13.1, TypeScript 7.0.2, React 19.3.1, Vite 8.3.8, Fastify 5.12.8, Prisma 7.10.1, PostgreSQL 18.7, `exceljs` 4.4.0, Vitest 5.1.1, `@tanstack/react-query` 5.108.1, `react-router-dom` 7.18.6, `clsx` 2.1.1, `zod` 4.6.7, `@fastify/swagger` 9.9.5, `@testcontainers/postgresql` 12.2.2, `@testing-library/react` 16.3.3, `jsdom` 31.0.1 y los `@types` correspondientes.
- API: único endpoint `GET /api/health` en este change; los recursos de OP, etapas, horas y exportación se agregan en C-02 en adelante.
- Persistencia: contenedor de PostgreSQL 18.7 para desarrollo y `schema.prisma` sin modelos de negocio; las migraciones y el seed comienzan en C-02.
- Documentación: ADRs versionados bajo el change; `openspec/` se gestiona únicamente con CLI (R8) y `openspec/config.yaml` queda con el contexto confirmado del proyecto.
- Ejecución: PostgreSQL en Docker Desktop; Node/Fastify y el exportador en el host Windows para resolver rutas UNC nativamente; sin Python en runtime (R4).
