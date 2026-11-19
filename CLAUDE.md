# Velco — Instrucciones para Agentes

> Este archivo (y su copia `CLAUDE.md`) es lo PRIMERO que todo agente lee al entrar al repo.
> Generado a partir de `knowledge-base/` y `CHANGES.md`. No editar a mano sin re-sincronizar ambos archivos.

---

## Stack Tecnológico

| Capa | Tecnologías | Versión fijada |
|---|---|---|
| Presentación | React + Vite, TypeScript | React 19.3.1, Vite 8.3.8, TypeScript 7.0.2 |
| API | Fastify (Node.js) | Fastify 5.12.8, Node.js 26.13.1 (LTS activo) |
| Dominio / aplicación | TypeScript puro, sin dependencias de framework | TypeScript 7.0.2 |
| Persistencia | PostgreSQL + Prisma | PostgreSQL 18.7, Prisma 7.10.1 (cliente y CLI; no 8.0.0-rc.34 por ser RC) |
| Exportación | `exceljs` sobre plantillas `.xlsx` existentes | exceljs 4.4.0 |
| Estilos | CSS Modules (nativo de Vite) + `global.css` para reset y variables | `clsx` 2.1.1 |
| Server state | TanStack Query | @tanstack/react-query 5.108.1 |
| Routing | React Router | react-router-dom 7.18.6 |
| Tests | Vitest (TDD estricto) | Vitest 5.1.1, @testcontainers/postgresql 12.2.2, @testing-library/react 16.3.3, jsdom 31.0.1 |
| Soporte y tipos | `zod`, `@fastify/swagger`, `@types/node`, `@types/react`, `@types/react-dom` | zod 4.6.7, @fastify/swagger 9.9.5, @types/node 26.6.6, @types/react 19.3.0, @types/react-dom 19.3.0 |
| Infraestructura | PostgreSQL local/self-hosted, orquestación con Docker Compose | PostgreSQL 18.7 (PG14 está EOL desde 2026-11-12) |

Versiones fijadas en C-01 (2026-11-19).

Ejecución: PostgreSQL en Docker Desktop; Node/Fastify y el exportador en el host Windows (rutas UNC nativas). Sin Python en el stack (R4 intacta).

Detalle completo: [knowledge-base/02_descripcion_general.md](knowledge-base/02_descripcion_general.md)

---

## Base de Conocimiento

La fuente de verdad del dominio vive en `knowledge-base/`. **Leé el archivo relevante ANTES de implementar.**

| Archivo | Cuándo leerlo |
|---------|---------------|
| [01_vision_y_objetivos.md](knowledge-base/01_vision_y_objetivos.md) | Entender propósito y alcance |
| [02_descripcion_general.md](knowledge-base/02_descripcion_general.md) | Stack elegido, arquitectura general, integraciones y API REST |
| [03_actores_y_roles.md](knowledge-base/03_actores_y_roles.md) | Actores del MVP, matriz RBAC actual y planificada, rutas |
| [04_modelo_de_datos.md](knowledge-base/04_modelo_de_datos.md) | Entidades, ERD, migraciones y agregados derivados |
| [05_reglas_de_negocio.md](knowledge-base/05_reglas_de_negocio.md) | Reglas codificadas (RN-XX) |
| [06_funcionalidades.md](knowledge-base/06_funcionalidades.md) | Historias de usuario por épica |
| [07_flujos_principales.md](knowledge-base/07_flujos_principales.md) | Flujos E2E |
| [08_arquitectura_propuesta.md](knowledge-base/08_arquitectura_propuesta.md) | Patrones, estructura, env vars y testing |
| [09_decisiones_y_supuestos.md](knowledge-base/09_decisiones_y_supuestos.md) | Decisiones `DD-NN`, supuestos `SU-NN` y trade-offs |
| [10_preguntas_abiertas.md](knowledge-base/10_preguntas_abiertas.md) | ⚠️ Inconsistencias a resolver ANTES de codear |

> ⚠️ Resolver las preguntas de prioridad **Alta** de `10_preguntas_abiertas.md` antes de arrancar el primer change.

---

## Skills Disponibles

| Agente | Rol | Skills que carga |
|--------|-----|------------------|
| **Backend Core** | Fastify / Prisma / dominio puro / migraciones | `prisma-orm-setup`, `postgresql-database-engineering`, `domain-modeling` (`prisma-postgres` es alias de compatibilidad deprecado) |
| **Backend Aux / Infra** | Spike Excel, PostgreSQL y orquestación Docker | `docker-compose-orchestration` |
| **Frontend** | React / Vite / TypeScript / componentes | `vercel-react-best-practices` |
| **Testing** | TDD estricto con Vitest | `vitest` |
| **Orquestación / SDD** | OPSX / KB / roadmap / reglas de agente | `jr-orchestrator`, `kb-creator`, `roadmap-generator`, `agents-md-generator`, `openspec-init`, `openspec-explore`, `openspec-propose`, `openspec-design`, `openspec-spec`, `openspec-tasks`, `openspec-apply-change`, `openspec-verify`, `openspec-archive-change`, `openspec-sync-specs`, `openspec-onboard`, `skill-creator`, `find-skills`, `judgment-day`, `issue-creation`, `branch-pr` |

Cargá la skill correspondiente al contexto ANTES de escribir código.

> Los compact rules de cada skill los resuelve el orquestador desde `.atl/skill-registry.md` (generado por `skill-registry`; no versionado — no está en el repo). Esta tabla solo mapea skill→rol.

---

## Roadmap de Changes

El plan de implementación completo está en [CHANGES.md](CHANGES.md). Resumen:

- **Total**: 16 changes en 5 fases (FASE 0 — Fundación a FASE 4 — Exportación).
- **Camino crítico** (11 changes): `C-01 → C-02 → C-03 → C-04 → C-05 → C-06 → C-08 → C-11 → C-14 → C-15 → C-16`.
- **Primer change**: `C-01` (`velco-mvp-foundation`).

**Antes de cualquier `/opsx:propose`**: leé [CHANGES.md](CHANGES.md), identificá las dependencias del change y los archivos de "Leer antes".

---

## Reglas Duras (específicas del proyecto)

> Reglas globales ya definidas en `~/.config/opencode/AGENTS.md` (commits convencionales sin co-autoría IA, no buildear, STOP-and-wait, verificación de claims, idioma y tono): el proyecto las hereda. Acá viven solo las reglas específicas de Velco + las universales que el global no cubre.

Son contrato; romperlas es un defecto. Formato `NUNCA X → hacer Y`:

- R1: NUNCA escribir código de producción sin un test fallido previo → ciclo RED → GREEN → TRIANGULATE (mínimo 2 casos) → REFACTOR con Vitest.
- R2: NUNCA importar Fastify, Prisma, React ni `exceljs` en `domain/` → puertos + adaptadores por feature; eliminar TODOS los adaptadores (`backend/src/features/*/{http,prisma,excel}`) debe seguir compilando `packages/domain/`.
- R3: NUNCA persistir un valor derivado → avance, horas totales, costos, margen y semáforo se calculan; única excepción: `GENERATED ALWAYS AS (...) STORED` de PostgreSQL.
- R4: NUNCA introducir un segundo lenguaje en runtime → todo TypeScript; Python solo en spikes descartables fuera del repo.
- R5: NUNCA implementar auth/PIN/RBAC en el MVP → un único usuario; cualquier código de auth requiere aprobación humana explícita.
- R6: NUNCA generar `.xlsx` desde cero → cargar y rellenar las plantillas oficiales; `incluirMargenes` como parámetro.
- R8: NUNCA crear ni editar `openspec/` a mano → siempre vía CLI (`openspec new change`, `status`, `instructions`).
- R9: NUNCA usar `any` ni un `tsconfig` no estricto → tipos estrictos; componentes React en PascalCase.
- R10: NUNCA hacer mock de PostgreSQL en tests de integración → BD real (contenedor); los tests de reglas de negocio son puros y no la necesitan.

---

## Flujo de Trabajo

```
1. Leer la KB relevante (knowledge-base/)        → entender el dominio
2. Identificar el change en CHANGES.md           → respetar dependencias
3. /opsx:propose C-NN-nombre                     → proposal + design + specs + tasks
4. Implementar las tasks (cargando skills)       → respetando las reglas duras
5. /opsx:archive C-NN-nombre + marcar [x]        → cerrar el change
```

Aplicar TODAS las reglas duras en cada paso. Ante conflicto entre la KB y este archivo, las reglas duras prevalecen.
