# Arquitectura Propuesta

## Patrones aplicados

| Patrón | Dónde se usa | Por qué |
|---|---|---|
| Arquitectura hexagonal (Puertos y Adaptadores) | Dominio en `packages/domain` y adaptadores por feature en `backend` | Aísla el dominio de Fastify, Prisma y `exceljs`; habilita TDD |
| Funciones puras de dominio | Semáforo, avance, horas, márgenes, `exportOp` | Misma regla en API y UI, testeable sin DB ni framework |
| Casos de uso (Application layer) | `createOp`, `listOps`, `imputarHoras`, `exportOp` | Orquestan dominio + repositorios sin conocer HTTP |
| Repositorio | Acceso a PostgreSQL mediante Prisma | Sustituible en tests; una sola implementación de consultas |
| Container / Presentational | React: contenedores cargan datos, componentes de tarjeta solo renderizan | El cálculo no vive en el componente |
| DTO de salida | Respuestas de API y view models | En Fase 2 permite quitar montos según rol sin tocar el dominio |
| Plantilla + Adapter (Excel) | `exceljs` rellenando `.xlsx` existentes | Preserva el formato oficial de Velco |
| Singleton de configuración | `configuracion.id = 1` | Un único juego de parámetros globales |

**Regla de oro:** ninguna regla de negocio dentro de un componente React, un handler de Fastify ni un schema de Prisma. Esos son adaptadores.

## Estructura de directorios

Organización por **vertical slices de feature**: cada feature concentra su caso de uso, su adaptador HTTP y su persistencia/exportación. El dominio vive en `packages/domain`, sin dependencias de framework (R2).

```text
Software-de-Seguimiento-Velco-/
├── Docs/                              # fuentes vigentes (no se editan)
│   ├── definici_n_del_mvp_velco.md
│   ├── historias_de_usuario_velco.md
│   ├── tablero-taller-v2.html
│   └── FichasExcel/
│       ├── A - OP-MASTER.xlsx
│       └── MASTER COSTEO NUEVO.xlsx
├── knowledge-base/                    # esta KB
├── openspec/                          # fundación OPSX (ya inicializada)
├── packages/
│   └── domain/
│       └── src/
│           ├── ordenes/
│           ├── etapas/
│           ├── horas/
│           ├── materiales/
│           ├── costos/                # semáforo, margen, derivados
│           ├── exportacion/           # exportOp(opId,{incluirMargenes}) PURA
│           └── configuracion/
├── backend/
│   ├── src/
│   │   ├── features/
│   │   │   ├── ordenes/{application,http,prisma}/
│   │   │   ├── etapas/{application,http,prisma}/
│   │   │   ├── horas/{application,http,prisma}/
│   │   │   ├── materiales/{application,http,prisma}/
│   │   │   ├── costos/{application,http}/
│   │   │   ├── exportacion/{application,http,excel}/
│   │   │   └── configuracion/{application,http,prisma}/
│   │   ├── shared/                    # infraestructura transversal
│   │   └── main.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── test/
├── frontend/
│   └── src/
│       ├── app/                       # routing y composición
│       ├── features/
│       │   ├── tablero/{components,hooks,queries}/
│       │   ├── ordenes/{components,hooks,queries}/
│       │   ├── horas/{components,hooks,queries}/
│       │   ├── rentabilidad/{components,hooks,queries}/
│       │   ├── configuracion/{components,hooks,queries}/
│       │   └── exportacion/{components,hooks,queries}/
│       ├── shared/                    # UI compartida y cliente HTTP
│       ├── global.css                 # reset, tipografía y variables
│       └── main.tsx
├── docker-compose.yml                 # PostgreSQL para desarrollo
└── .jr-orchestrator-state.json
```

## Seguridad

- **Autenticación:** no existe en el MVP. Una sola persona, acceso total, despliegue interno/intranet. No hay tabla `usuarios`, login ni mecanismo de autenticación (R5).
- **Autorización:** no hay RBAC técnico. La matriz de [03_actores_y_roles.md](03_actores_y_roles.md) para Fase 2 es planificación, no código.
- **Dominio CRITICAL:** cualquier cambio de auth requiere aprobación humana explícita antes de escribir código (DD-07 / RN-AU-03).
- **Fase 2 (HU-19):** `Admin/Oficina` ve costos y márgenes; `Taller` no ve montos. Los documentos vigentes no definen PIN ni mecanismo de autenticación; cualquier auth/PIN/RBAC requiere aprobación humana explícita (R5).
- **Validación de input:** en la frontera HTTP con esquemas (longitud de `numero_op`, `horas > 0`, fechas válidas, rangos de umbrales); revalidación en el dominio para las reglas de negocio. `NUMERIC` para dinero y horas.
- **Secrets management:** variables de entorno; `DATABASE_URL` nunca versionada; `.env` ignorado por git; la conexión a recursos UNC se resuelve por configuración, no hardcodeada.
- **Exportación:** los archivos se sirven con `Content-Disposition` y nombre `COSTEO_`/`OP_` según corresponda; no se exponen rutas del servidor al cliente.
- **Consideración:** la ausencia de auth es una decisión de alcance; no debe interpretarse como apto para exposición pública.

## Variables de entorno

| Variable | Descripción | Ejemplo | Sensible |
|---|---|---|---|
| `DATABASE_URL` | Cadena de conexión a PostgreSQL | `postgresql://velco:***@localhost:5432/velco` | Sí |
| `PORT` | Puerto HTTP de Fastify | `3001` | No |
| `EXCEL_TEMPLATES_DIR` | Directorio con las dos plantillas oficiales | `./Docs/FichasExcel` | No |
| `EXCEL_UNC_BASE` | Ruta UNC histórica de OP digitalizadas (Fase 2 / spike) | `\\Servidor\g\OPERACIONES\ORDENES DE PROCESO\OP - DIGITALIZADA\` | No |
| `CORS_ORIGIN` | Origen permitido del SPA de Vite | `http://localhost:5173` | No |
| `LOG_LEVEL` | Nivel de logging del backend | `info` | No |
| `TZ` | Zona horaria para comparación de fechas de entrega | `America/Argentina/Mendoza` | No |

> `TZ` y la zona horaria real de Velco son un supuesto a confirmar (ver SU-05 en [09_decisiones_y_supuestos.md](09_decisiones_y_supuestos.md)).

## Estrategia de testing (TDD estricto con Vitest)

1. **Unitarias:** reglas `RN-*` como funciones puras (semáforo en los cuatro estados, avance derivado, alerta 15%, margen con fallback de costo). Se escriben **antes** que la implementación.
2. **Integración:** repositorios Prisma contra PostgreSQL 18.7 en contenedor (`@testcontainers/postgresql` 12.2.2); transacciones de alta de OP y recálculo de derivados.
3. **Contrato:** `exportOp` produce el mismo modelo para ambas variantes; el adaptador `exceljs` respeta celdas combinadas y bloques de la plantilla.
4. **Componentes:** tarjeta con etapa `ahora` y semáforo; verificación de que no existe el slider de avance del prototipo.
5. **Aceptación:** recorridos HU-01, HU-07, HU-14, HU-20A y HU-20B.

## Infraestructura y despliegue

- Versiones fijadas en C-01 (2026-11-19): ver la tabla de stack en [02_descripcion_general.md](02_descripcion_general.md).
- `needs_infra: true`: PostgreSQL 18.7 es obligatorio (UUID, `gen_random_uuid()`, JSONB, `TIMESTAMPTZ`).
- Desarrollo: PostgreSQL local orquestado con Docker Compose (skill `docker-compose-orchestration` disponible).
- Plantillas `.xlsx` se tratan como activos del servidor, no como blobs en la base de datos.
- No hay colas, caché, cron jobs ni servicios externos en el MVP.

## Spike técnico pendiente (Excel)

Verificar con un spike acotado antes de Sprint 4:

- Cómo `exceljs` preserva el **enlace externo de ~577 KB** incluido en `MASTER COSTEO NUEVO.xlsx`.
- Cómo se comporta con referencias a la ruta UNC `\\Servidor\g\OPERACIONES\ORDENES DE PROCESO\OP - DIGITALIZADA\`.
- Si el enlace se mantiene, se elimina o se reemplaza por un valor estático sin romper la planilla oficial.

## Fuentes

- `Docs/definici_n_del_mvp_velco.md` §3 y §4.
- `Docs/historias_de_usuario_velco.md` (principios de diseño y HU-20A/B).
- `Docs/tablero-taller-v2.html` (referencia visual).
- Decisiones 1, 2, 7, 9 y 10 de [09_decisiones_y_supuestos.md](09_decisiones_y_supuestos.md).
