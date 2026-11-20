# DD-01 — Stack tecnológico (Opción B)

Versión: 1
Estado: Aceptada

## Contexto

El MVP de seguimiento de órdenes de producción necesitaba un stack único antes de crear el proyecto. Los mínimos históricos de la KB (React 18+, Vite 5+, TypeScript 5+, Fastify 4+, Prisma 5+, Vitest 1+) quedaron superados por las versiones estables vigentes al 2026-11-19. Node 20 está EOL desde 2026-04-30.

## Decisión

Adoptar la Opción B con versiones exactas: Node.js 26.13.1 (LTS activo), TypeScript 7.0.2, React 19.3.1, Vite 8.3.8, Fastify 5.12.8, Prisma 7.10.1 (cliente y CLI), PostgreSQL 18.7 (imagen `postgres:18.7`), `exceljs` 4.4.0, Vitest 5.1.1, `@tanstack/react-query` 5.108.1, `react-router-dom` 7.18.6, `clsx` 2.1.1, `zod` 4.6.7, `@fastify/swagger` 9.9.5, `@testcontainers/postgresql` 12.2.2, `@testing-library/react` 16.3.3, `jsdom` 31.0.1, `@types/node` 26.6.6, `@types/react` 19.3.0 y `@types/react-dom` 19.3.0. Se eligió stable actual y se descartaron release candidates. PostgreSQL 14 quedó EOL el 2026-11-12.

## Alternativas

- Next.js + SQLite: mezcla dominio con server actions y SQLite no cubre `UUID`, `gen_random_uuid()`, `JSONB` ni `TIMESTAMPTZ`.
- Python + openpyxl: rompe la unidad de lenguaje del runtime (R4).
- Express: más pesado que Fastify para HTTP + JSON simple.
- Prisma 8.0.0-rc.34: release candidate; se prefiere 7.10.1 estable.

## Justificación

SPA más API separada permite dominio testeable sin frameworks y TDD estricto con Vitest. La fijación exacta evita derivas entre entornos y hace explícita cada actualización.

## Trade-offs

Dos proyectos que mantener (backend y frontend) a cambio de un dominio aislado; los manifiestos requieren actualización deliberada. Sin SSR ni server actions.

## Trazabilidad

[CHANGES.md](../../../../CHANGES.md) C-01; [design.md](../design.md) D1; [knowledge-base/09_decisiones_y_supuestos.md](../../../../knowledge-base/09_decisiones_y_supuestos.md) DD-01; [knowledge-base/02_descripcion_general.md](../../../../knowledge-base/02_descripcion_general.md).
