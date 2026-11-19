## Context

Velco SRL necesita el MVP de un sistema web interno para seguir Órdenes de Producción de un taller metalúrgico; **no** es un sistema de tracking de flotas. Estado actual: `openspec init` ya ejecutado (DD-10), KB de diez archivos, `CHANGES.md` con 16 changes y `AGENTS.md` con las reglas duras R1–R10; no existe código de aplicación ni specs previas (`openspec list --specs` → «No specs found»). `C-01 velco-mvp-foundation` es GATE 0, governance **CRITICO**, sin dependencias y habilita C-02 y C-13.

El equipo es hispanohablante: todos los artefactos se redactan en español. El MVP lo usa una sola persona (gerente general), sin autenticación. Las versiones mínimas históricas del stack (React 18+, Vite 5+, TypeScript 5+, Fastify 4+, Prisma 5+, Vitest 1+) quedan **superadas** por las versiones estables fijadas en este change, verificadas el 2026-11-19. Se eligió stable actual y se descartaron release candidates. IN-09 quedó **RESUELTA por el usuario**: `Docs/MVP.md` y `Docs/HistoriasDeUsuario.md` se borraron deliberadamente por obsoletos; la documentación vigente del repositorio es la fuente.

## Goals / Non-Goals

**Goals:**

- Congelar DD-01…DD-10 como ADR versionados y trazables a `CHANGES.md` y la KB.
- Dejar un workspace TypeScript con `backend/`, `frontend/` y `packages/domain` que compile con `tsconfig` estricto y sin `any`, organizado en vertical slices por feature.
- Proveer `GET /api/health`, la separación feature-based con puertos y adaptadores y un `schema.prisma` inicializado sin modelos de negocio.
- Proveer entorno reproducible: PostgreSQL 18.7 en Docker Compose, `.env.example` completo y `.env` ignorado.
- Configurar Vitest 5.1.1 en ambos proyectos con tests de smoke que pasen antes de cualquier implementación.
- Registrar IN-08 y DD-07 como riesgos abiertos, y dejar constancia de la resolución de IN-09 como decisión, sin resolver nada silenciosamente.

**Non-Goals:**

- Código de aplicación de negocio, modelos Prisma de dominio, migraciones, seed ni reglas `RN-*`.
- Auth, PIN, login, RBAC o tabla `usuarios` (R5). Cualquier código de autenticación requiere aprobación humana explícita.
- Roles operativos completos: en el MVP solo se contempla HU-19 en Fase 2 (Admin/Oficina ve costos y márgenes; Taller sin montos).
- Tablero, grilla Kanban, slider de avance, endpoints de OP/etapas/horas/materiales ni cálculo de derivados.
- Exportación `.xlsx`, ZIP como requisito, tarifas por etapa, HTTPS, reverse proxy ni backups.
- Modificación manual de `openspec/` (R8) o ejecución de builds en el change de propuesta.

## Decisions

### D1 — Stack Opción B con fijación exacta de versiones (DD-01)

Se adopta el stack Opción B con las siguientes versiones **exactas**, verificadas el 2026-11-19. Estas versiones **superan los mínimos históricos** de la KB (React 18+, Vite 5+, TypeScript 5+, Fastify 4+, Prisma 5+, PostgreSQL 14+, Vitest 1+): se eligió la versión stable actual disponible y se evitaron release candidates.

- Node.js **26.13.1** (LTS activo; Node 20 está EOL desde 2026-04-30)
- TypeScript **7.0.2**
- React **19.3.1**
- Vite **8.3.8**
- Fastify **5.12.8**
- Prisma **7.10.1** (cliente y CLI; NO 8.0.0-rc.34 por ser release candidate)
- PostgreSQL **18.7** (PG14 EOL desde 2026-11-12; imagen Docker `postgres:18.7`)
- `exceljs` **4.4.0**
- Vitest **5.1.1**
- `@tanstack/react-query` **5.108.1**
- `react-router-dom` **7.18.6**
- `clsx` **2.1.1**
- `zod` **4.6.7**
- `@fastify/swagger` **9.9.5**
- `@testcontainers/postgresql` **12.2.2**
- `@testing-library/react` **16.3.3**
- `jsdom` **31.0.1**
- `@types/node` **26.6.6**, `@types/react` **19.3.0**, `@types/react-dom` **19.3.0**

*Alternativas descartadas:* Next.js + SQLite (mezcla dominio con server actions y no soporta los tipos del SQL propuesto); Python/openpyxl (rompe la unidad de lenguaje, R4); Express (más pesado que Fastify para HTTP/JSON simple); Prisma 8.0.0-rc.34 (release candidate, no stable). *Trade-off:* dos proyectos que mantener a cambio de dominio testeable; la fijación exacta exige actualizar manifiestos de forma deliberada.

### D2 — Workspace con paquete `packages/domain` compartido

Backend y frontend importan tipos y contratos desde `packages/domain/src/<feature>/`, de modo que no existan dos definiciones de la misma regla o DTO. Cada feature agrupa sus reglas puras en esa carpeta; el paquete se compila de forma aislada.

*Alternativas descartadas:* duplicar tipos en cada proyecto (divergencia garantizada); publicar un paquete npm externo (overhead innecesario para un sistema interno). *Trade-off:* configuración de workspace adicional, mitigada con la configuración mínima que requiere el tooling.

### D3 — Backend feature-based con un único endpoint de infraestructura

`backend/src` queda organizado en vertical slices: `backend/src/features/<feature>/{application,http,prisma,excel}` contiene el caso de uso, el controlador Fastify, el adaptador Prisma y el adaptador Excel de esa feature. `backend/src/shared/` agrupa lo común al backend y `main.ts` el arranque. El único endpoint es `GET /api/health`, que responde JSON con estado `ok` y escucha el puerto indicado por `PORT`. `CORS_ORIGIN` se lee de configuración. Ningún handler contiene reglas de negocio.

No existe un directorio único `infrastructure/`: los adaptadores viven dentro de cada feature, acotados a ella.

*Alternativas descartadas:* estructura por capas transversales con `infrastructure/` central (acopla features entre sí y dificulta eliminar adaptadores de forma selectiva); estructura plana tipo Express (acopla HTTP con dominio); crear controllers de OP vacíos anticipando C-02 (inventa alcance). *Trade-off:* carpetas vacías o con contratos mínimos al inicio, que se llenan en changes posteriores.

### D4 — Aislamiento verificable del dominio (R2)

`packages/domain/src/<feature>/` no importa Fastify, Prisma, React ni `exceljs`. La verificación es mecánica: al eliminar **TODOS** los adaptadores por feature (`backend/src/features/*/prisma`, `backend/src/features/*/excel` y `backend/src/features/*/http`), `packages/domain/` debe seguir compilando. Las dependencias externas se inyectan mediante puertos declarados en `backend/src/features/<feature>/application/` e implementados en los adaptadores de esa feature.

*Alternativas descartadas:* importar Prisma directamente en reglas (atajo que destruye TDD); tests con mocks de Prisma en lugar de puertos (no prueba el aislamiento); conservar `infrastructure/` como capa central (ya no existe en el diseño feature-based).

### D5 — Tipado estricto y convenciones de UI (R9)

`tsconfig` estricto en todos los proyectos, prohibición de `any` y componentes React en PascalCase. Estilos con CSS Modules nativos de Vite y un único `frontend/src/global.css` para reset, tipografía y variables; clases condicionales con `clsx` 2.1.1 o template strings.

*Alternativas descartadas:* Tailwind (tooling adicional y CSS no real en archivos `.module.css`); CSS global sin scope (colisiones); `any` o `tsconfig` laxo (errores diferidos a runtime).

### D6 — Server state y routing resueltos en la fundación

`@tanstack/react-query` 5.108.1 y `react-router-dom` 7.18.6 quedan instalados, configurados y con sus versiones fijadas en C-01, de modo que C-05 no tenga que decidir infraestructura. `frontend/src/app/` contiene la composición de la aplicación; `frontend/src/features/<feature>/{components,hooks,queries}` la UI, los hooks y las queries por feature; `frontend/src/shared/` lo común. La SPA no calcula derivados ni incorpora el slider o las columnas del prototipo.

*Alternativas descartadas:* `useEffect` + `fetch` manual (duplica lógica de caché); router propio (reinventar solución probada).

### D7 — PostgreSQL 18.7 en Docker Compose y Prisma sin modelos (R3)

`docker-compose.yml` expone PostgreSQL 18.7 (imagen `postgres:18.7`) para desarrollo; PostgreSQL 14 quedó EOL el 2026-11-12. `backend/prisma/schema.prisma` contiene solo `datasource` y `generator` de Prisma 7.10.1; no define modelos de negocio ni columnas para avance, totales de horas, costos, margen ni semáforo. La única excepción permitida a R3 sería `GENERATED ALWAYS AS (...) STORED`, que tampoco se usa en este change.

*Alternativas descartadas:* PostgreSQL instalado directamente en el host (entorno no reproducible); SQLite (incompatible con UUID, `gen_random_uuid()`, JSONB y `TIMESTAMPTZ`); precargar modelos del C-02 (adelanta alcance).

### D8 — Configuración por entorno, sin secretos versionados

`.env.example` documenta `DATABASE_URL`, `PORT`, `CORS_ORIGIN`, `TZ`, `EXCEL_TEMPLATES_DIR` y `EXCEL_UNC_BASE`; `.env` se ignora por git. Las rutas UNC se leen desde `EXCEL_UNC_BASE`, nunca se hardcodean. El valor de `TZ` queda como configuración pendiente de confirmación (SU-05).

*Alternativas descartadas:* versionar `.env` (expone secretos); escribir la UNC literal en código (rompe portabilidad y el spike C-13).

### D9 — Vitest primero en ambos proyectos (R1, R10)

Backend y frontend tienen Vitest 5.1.1 configurado con scripts de test; el entorno de pruebas usa `@testing-library/react` 16.3.3 y `jsdom` 31.0.1. Antes de cualquier implementación existen los tests de smoke de health check y de configuración de Vitest. El ciclo es RED → GREEN → TRIANGULATE (mínimo dos casos) → REFACTOR. Los tests de integración usan PostgreSQL real en contenedor mediante `@testcontainers/postgresql` 12.2.2; los tests de reglas puras no necesitan base de datos.

*Alternativas descartadas:* escribir la implementación primero y tests después (rompe R1); mockear Prisma en integración (rompe R10 y oculta fallos reales).

### D10 — ADRs versionados y decisión sobre IN-09

Los DD-01…DD-10 se registran como ADR con contexto, decisión, alternativas, justificación y trade-offs. IN-08 (spike Excel de C-13) y DD-07 (aprobación humana para auth de Fase 2, R5) permanecen abiertos.

**IN-09 queda RESUELTA por el usuario:** `Docs/MVP.md` y `Docs/HistoriasDeUsuario.md` se borraron deliberadamente por obsoletos. La documentación vigente del repositorio es la fuente; **no se recuperan documentos del historial de git**. Tampoco se usa ZIP ni PIN como requisitos: la exportación consolidada en ZIP no tiene respaldo en la documentación vigente, no se incluye en el MVP y requiere confirmación futura; el PIN pertenece a la auth diferida (R5). En cuanto a roles, solo se contempla HU-19 en Fase 2 (Admin/Oficina ve costos y márgenes; Taller sin montos); cualquier auth/PIN/RBAC requiere aprobación humana explícita (R5) y no está en el MVP.

*Alternativas descartadas:* restaurar los documentos borrados desde git (reintroduciría fuentes obsoletas); dar los riesgos restantes por resueltos sin evidencia; incorporar auth «para adelantar» Fase 2 (dominio CRITICO).

## Risks / Trade-offs

- **[IN-08 — enlace externo de ~577 KB y ruta UNC en plantilla de costeo] →** no implementar exportación en C-01; el spike `C-13` debe cerrarse antes de `C-14` y dictaminar si se preserva, elimina o reemplaza el enlace.
- **[DD-07 — ausencia de autenticación] →** restringir el despliegue a intranet; rechazar cualquier código de auth/PIN/RBAC sin aprobación humana explícita (R5).
- **[R3 — costumbre del prototipo de persistir `porcentaje_avance`] →** `schema.prisma` sin derivados; revisión explícita al crear los modelos en C-02.
- **[R10 — tentación de simular PostgreSQL en los smoke tests] →** el smoke usa el endpoint real; la integración usa contenedor real desde el primer test que lo requiera.
- **[Fijación de versiones sin acceso a registry] →** las versiones exactas quedan documentadas en design, spec y manifiestos; reportar cualquier dependencia que no pueda resolverse.
- **[Feature-based multiplica carpetas pequeñas] →** mantener `application`, `http`, `prisma` y `excel` solo en las features que existan; no crear features vacías especulativas fuera del esqueleto de fundación.
- **[Sin HTTPS, reverse proxy ni backups en el MVP] →** decisión de alcance asumida para intranet; diferida a Fase 2, no un descuido.

## Migration Plan

1. Verificar estado de OpenSpec y contexto (ya realizado: `openspec list --json` sin changes; config con contexto confirmado).
2. Crear el change y sus artefactos únicamente con la CLI (`openspec new change`, `openspec instructions`, `openspec status`, `openspec validate`), sin edición manual de la estructura.
3. Durante la implementación, en orden y con test fallido previo: (a) workspace feature-based, `tsconfig` estricto y fijación de versiones exactas; (b) ADRs DD-01…DD-10 con IN-09 resuelta; (c) `packages/domain/src/<feature>`; (d) `backend/src/features/<feature>` con health check; (e) `frontend/src/features/<feature>`, `app`, `shared` y `global.css`; (f) Docker Compose con `postgres:18.7`, Prisma 7.10.1 y `.env.example`; (g) tests de smoke de ambos proyectos. No hay migraciones de base de datos en este change.
4. Rollback: no hay datos ni esquema que restaurar; basta con eliminar los directorios y archivos creados y revertir los manifiestos. El archivado con `openspec archive` se ejecuta solo tras verificación y con el checkbox `[x]` de C-01 en `CHANGES.md`.

## Open Questions

- **IN-08 (Alta):** ¿cómo maneja `exceljs` 4.4.0 el enlace externo de ~577 KB y la ruta UNC? Se resuelve en el spike `C-13`, no aquí.
- **DD-07 (Alta):** ¿se aprueba el diseño de auth de Fase 2 antes de escribir cualquier código de autenticación? Requiere aprobación humana explícita (R5).
- **SU-02 / SU-05 (Media):** confirmar zona horaria y moneda para fijar `TZ` y las convenciones de redondeo en la configuración.
