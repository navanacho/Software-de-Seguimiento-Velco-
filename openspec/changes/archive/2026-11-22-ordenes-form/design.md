## Context

C-06 quedó archivado con la API de escritura completa: `POST /api/ops`, `PUT /api/ops/:id`, `POST /api/clientes`, gestión de etapas (`POST`, reorden `PATCH .../orden`, `DELETE`) y `POST /api/ops/:id/materiales`. `TarjetaOrdenDTO` y `DetalleOpDTO` ya transportan `codigoPlano: string | null`, el 409 de plano incluye `opExistente` y el 409 de OP no lo incluye (DU-4). La UI, en cambio, sigue siendo solo el tablero de C-05: `App.tsx` registra únicamente `/` y `/salud`; `TarjetaOrden.tsx` no muestra el plano; no existe cliente HTTP de escritura ni vista de detalle (verificado en `frontend/src/`).

La gobernanza de C-07 es **BAJO**. R1–R10 rigen sin excepción y se escribe en español rioplatense técnico. Los contratos de C-06 se consumen tal cual: este change no propone cambios de backend, migraciones ni reglas de dominio.

## Goals / Non-Goals

**Goals:**

- Entregar `/ops/nueva` y `/ops/:id/editar` con cabecera, plano opcional, cliente existente o inline, línea base (horas vendidas por etapa y materiales) y editor de etapas (HU-01, HU-02, HU-04; Flujo 1).
- Renderizar `Plano: [codigo]` / `Sin plano` en tarjeta y detalle leyendo el DTO, sin derivar ni formatear en React (RN-OP-05/06, DD-11, RN-GLOBAL-02).
- Mapear 422 y 409 a errores por campo, con mensaje literal y enlace a la OP existente cuando corresponda (RN-OP-06, DU-4).
- Persistir agregar/quitar/reordenar etapas usando los endpoints de C-06, conservando `horasVendidas` y sin renombrar (RN-ETAPA-01..03, DU-3).
- Mantener el dominio puro, el cliente HTTP delgado y el ciclo RED → GREEN → TRIANGULATE → REFACTOR con tests de componente (R1, R2, R10).

**Non-Goals:**

- No modificar endpoints, esquemas Zod del backend, Prisma, migraciones ni reglas de dominio de C-06.
- No implementar imputación de horas reales (C-08/C-09), rentabilidad (C-11), dashboard (C-17) ni design system completo (C-18).
- No editar ni borrar materiales: C-06 solo da de alta (DU-2); la UI no promete lo que la API no ofrece.
- No renombrar etapas, no slider de avance y no taxonomía cerrada (DU-3, RN-ETAPA-03, R3).
- No agregar `GET /api/configuracion`, auth/PIN/RBAC, Excel, derivados persistidos ni dependencias nuevas (R5, R6, R3, R4).
- No tocar `CHANGES.md`, `Docs/`, `knowledge-base/` ni artefactos openspec archivados desde este change.

## Decisions

### D1 — Vertical slice `ordenes`, con contenedor y componentes presentacionales

Se crea `frontend/src/features/ordenes/{components,hooks,queries}/` siguiendo la estructura de `08_arquitectura_propuesta.md` y el patrón ya instalado en `features/tablero/`. Las páginas `OrdenFormPage` (contenedores) cargan el detalle con TanStack Query y pasan props a `FormularioOrden`, `EditorEtapas` y `ListaMateriales` (presentacionales). Las mutaciones viven en hooks bajo `hooks/`; ningún componente llama a `fetch`, calcula derivados ni decide reglas de negocio (RN-GLOBAL-02, patrón Container/Presentational).

*Alternativas descartadas:* formulario único con `useEffect` de fetch y lógica mezclada (rompe la separación ya auditada); un componente "dumb" sin slice propio (mezclaría dos features); estado global nuevo (no hay store en el stack). *Trade-off:* más archivos pequeños; se compensa con tests de componente aislados.

### D2 — Espejo Zod de requests y errores, con mapeo por `path`

`shared/domain-client/` incorpora esquemas que espejan `BodyCreateOpSchema`, `BodyUpdateOpSchema`, `BodyAltaEtapaSchema`, `BodyReordenEtapaSchema`, `BodyAltaMaterialSchema` y `BodyAltaCliente` **solo en la frontera HTTP**. Los errores se modelan como un discriminado: `validation_error` (`details[].path` → campo), `codigo_plano_duplicado` (`codigoPlano`, `opExistente`), `numero_op_duplicado` (`numeroOp`) y `not_found`. La UI resalta el campo usando `path` sin reimplementar validaciones de dominio; el tipado usa `z.infer` y `satisfies`, nunca `any` (R9).

*Alternativas descartadas:* `any` en `response.json()` (R9); confiar en `error.message` sin parsear (pierde el campo y el enlace); reutilizar los esquemas del backend por import directo (acoplaría frontend a Fastify, R2). *Trade-off:* duplicar la definición de la forma es inevitable porque el backend no publica sus esquemas como paquete; el typecheck y los tests de espejo detectan la desincronización.

### D3 — Plano: la UI envía, el backend normaliza y el 409 se traduce en enlace

El input usa el placeholder literal `Opcional — Ej: PL-2026-045` y envía la cadena tal cual (o `null` si está vacío). La normalización `trim()` + `toUpperCase()` y vacío ⇒ `NULL` siguen ocurriendo en la frontera HTTP del backend (RN-OP-06); la UI **no** normaliza para no duplicar la regla. El badge se renderiza desde `codigoPlano`: distinto de `null` ⇒ `Plano: <codigo>`, `null` ⇒ `Sin plano`. En el 409 se muestra el `message` exacto del servidor y un enlace a `/ops/${opExistente.id}`; en el 409 de OP se resalta `numeroOp` sin enlace (DU-4).

*Alternativas descartadas:* normalizar en React (duplica RN-OP-06 y puede divergir); convertir `null` en texto en el DTO (prohibido por `dto-derivados-orden`); mostrar un toast genérico sin acceso a la OP existente (incumple la HU-01 del alcance C-07). *Trade-off:* el usuario ve el valor recién normalizado tras la respuesta, no mientras escribe; es el comportamiento ya contratado en C-06.

### D4 — Cliente: selección del conjunto base + alta inline idempotente

El selector reutiliza los pares `{clienteId, clienteNombre}` que `TableroPage` ya captura como base estable (spec `filtros-y-estado-vacio-tablero`); la opción *Nuevo cliente* llama a `POST /api/clientes` con `{ nombre }` y usa el `id`/`nombre` devueltos. Ese endpoint es idempotente: responde 200 con el cliente existente o 201 con uno nuevo, así que no se inventa un `GET /api/clientes`. El alta de OP envía `clienteNombre` (no `clienteId`), tal como exige `BodyCreateOpSchema`.

*Alternativas descartadas:* texto libre en la OP (RN-OP-04 lo prohíbe); nuevo endpoint de listado de clientes (fuera de scope); selector que consulte `GET /api/ops` filtrado (caro y ya resuelto en el tablero). *Trade-off:* desde `/ops/nueva` sin pasar por el tablero el conjunto base puede estar vacío; en ese caso el formulario ofrece directamente el alta inline, que es suficiente para el MVP de un solo usuario.

### D5 — Etapas: precarga canónica, envío condicional y persistencia verificada

En alta se precargan los nombres canónicos `Corte`, `Soldadura`, `Mecanizado`, `Pintura`, `Entrega` (RN-CONFIG-01 / `configuracion.etapas_default`) como valor inicial del editor. Como **no existe `GET /api/configuracion` en el MVP** (C-10), si el usuario no toca la lista se omite el campo `etapas` del `POST /api/ops`: el backend aplica su propio `configuracion.etapas_default`, que sigue siendo la fuente autoritativa. Si agrega, quita o reordena, se envía la colección explícita con `horasVendidas` como string decimal. En edición, el editor carga las etapas de `GET /api/ops/:id` y persiste cada cambio con `POST`, `PATCH .../orden` o `DELETE`; las respuestas de alta/reorden son `{ ok: true }`, por lo que el hook **invalida y reconsulta** el detalle para comprobar el orden persistido y repintar con el DTO del servidor (no con estado local reordenado). No se renombra etapa (DU-3).

*Alternativas descartadas:* agregar un endpoint de lectura de configuración en C-07 (cambio de backend fuera de scope); UI optimista que reordene localmente y confíe en el éxito (no probaría persistencia y duplicaría el orden); borrar y recrear etapas (pierde ids y `horasVendidas`). *Trade-off:* la precarga puede quedar desactualizada si C-10 cambia `etapas_default`; se registra como deuda conocida y C-10 deberá exponer la lectura o actualizar la constante.

### D6 — Materiales: alta en la transacción de OP y alta independiente en edición

En alta, los materiales se envían dentro de `materiales` de `POST /api/ops` (la transacción de C-06 los inserta junto con OP y etapas). En edición, el detalle muestra la lista devuelta por `GET /api/ops/:id` y ofrece solo *Agregar material* vía `POST /api/ops/:id/materiales`; no hay botones de editar/borrar (DU-2). Tipos restringidos a `MP`/`INSUMOS`/`TERCERIZADOS` y decimales como string (`cantidad > 0`, costos `>= 0`), espejando el esquema del backend.

*Alternativas descartadas:* prometer edición "para cuando llegue" (la API no la soporta); números float para montos (R3/RN-MARGEN-05); JSONB en el formulario (DD-05). *Trade-off:* corregir un material requiere intervención directa hasta un change posterior; se explicita en la UI con texto acotado.

### D7 — Detalle mínimo: nueva ruta de solo lectura

Dado que la SPA no tiene `/ops/:id`, C-07 agrega `DetalleOpPage` con `GET /api/ops/:id`, badge de plano, datos de cabecera, etapas con `horasVendidas`, materiales y enlace *Editar* a `/ops/:id/editar`. No muestra analítica, horas reales (`horas` llega vacío hasta C-08) ni exportación. Es el soporte necesario para cumplir "tarjeta y detalle muestran el badge" sin adelantar C-09/C-17.

*Alternativas descartadas:* poner el badge solo en la tarjeta (incumple el alcance); construir el detalle completo de HU-15/HU-16 en C-07 (rompe dependencias). *Trade-off:* la vista es deliberadamente pobre; se enriquecerá en changes futuros.

### D8 — Mutaciones: invalidación centralizada y navegación al tablero

Tras `POST`/`PUT` exitoso se invalidan las consultas con query key `['tablero']` y se navega a `/` con `useNavigate`, de modo que la tarjeta creada/actualizada aparece con datos del servidor. En fallo se permanece en el formulario con el error asociado al campo y se conserva lo escrito. No hay actualización optimista en este change: la respuesta de escritura de OP no es el DTO completo y el tablero debe recalcular KPIs/flujo en el servidor (RN-GLOBAL-02).

*Alternativas descartadas:* insertar la tarjeta en caché con datos del formulario (recalcula derivados en React y rompe KPIs); navegar sin invalidar (tarjeta ausente); limpiar el formulario tras error (pierde trabajo del único usuario). *Trade-off:* un round-trip adicional, aceptable en el MVP.

### D9 — Fechas: `fechaEntrega` editable, `fechaIngreso` informativa

`BodyCreateOpSchema`/`BodyUpdateOpSchema` aceptan `fechaEntrega` en formato `YYYY-MM-DD`, pero **no** aceptan `fechaIngreso` (la BD aplica `CURRENT_DATE`). El formulario muestra la fecha de ingreso como dato informativo del sistema y solo permite editar la entrega prometida, etiquetándola así. No se agrega el campo al payload para que la validación estricta `.strict()` del backend no rechace la request.

*Alternativas descartadas:* enviar `fechaIngreso` y ampliar el esquema backend (cambio fuera de scope); ocultar la fecha de ingreso (pierde contexto de Flujo 1). *Trade-off:* no se puede fijar retroactivamente la fecha de ingreso desde la UI; queda para un change que modifique el contrato de escritura.

### D10 — Safety net, TDD y guardianes

Antes de escribir código se corre el suite actual de `packages/domain`, `backend` y `frontend` sin modificarlo como baseline. Cada capability sigue RED → GREEN → TRIANGULATE (≥2 casos) → REFACTOR con trazabilidad `RN-XX-NN` en el nombre del test (RN-GLOBAL-04). Tests de componente con `@testing-library/react` + jsdom; los casos obligatorios son precarga de etapas, validación de `numero_op`, validación de plano, badge `Sin plano`, 409 de plano y reorden persistido. Guardianes: cero imports de frameworks en `packages/domain`, cero `any`, componentes en PascalCase, cero auth, sin builds ni commits.

*Alternativas descartadas:* snapshots sin aserciones semánticas; implementar primero y testear después (R1); mocks de PostgreSQL (R10, aunque este change no tiene tests de BD). *Trade-off:* los tests de componente no sustituyen a los de integración de C-06; se apoyan en ellos.

## Risks / Trade-offs

- **[La SPA no tiene `/ops/:id`] →** D7 entrega un detalle mínimo; se registra como supuesto del propose, no como cambio silencioso de alcance.
- **[`etapas_default` solo existe en el backend] →** D5 omite `etapas` cuando no se editan; deuda documentada para C-10.
- **[`fechaIngreso` no es writable] →** D9 la muestra solo como información; sin cambio de contrato en C-07.
- **[Las respuestas de etapas son `{ok:true}`] →** D5 reconsulta el detalle; el test *reorden persistido* falla si el orden solo cambia en memoria.
- **[Deriva del contrato de errores 409] →** D2 parsea con Zod y los tests usan el cuerpo exacto de `codigo-plano-unico` y DU-4; cualquier cambio de forma rompe el test antes de llegar a producción.
- **[Regresión del tablero] →** safety net sin modificar `App.tablero.test.tsx`, `TarjetaOrden*.test.tsx` y `esquemas.test.ts`; el badge se agrega sin tocar derivados.
- **[R5 / auth] →** rutas públicas dentro de intranet; cualquier requerimiento de roles se escala, nunca se codifica.

## Migration Plan

No hay migración de base de datos ni despliegue de datos: C-06 ya aplicó la migración 002. Rollback: revertir los archivos del slice `ordenes`, las rutas nuevas y el badge, sin tocar backend ni BD.

1. Verificar punto de partida: C-06 archivado, `CHANGES.md` con C-07 en `[ ]`, safety net verde y working tree sin cambios de openspec manuales (R8).
2. RED: tests de componente y de espejo Zod para el formulario, el editor de etapas y el badge; fallan por módulos ausentes (R1).
3. GREEN: cliente HTTP de escritura y esquemas de error en `shared/domain-client/`; rutas y página de detalle en `app/`; slice `features/ordenes/`.
4. GREEN: formulario con validación por campo y manejo de 409/422; badge en tarjeta y detalle; acción *Nueva OP* en el tablero.
5. TRIANGULATE: precarga con/sin edición, plano válido/duplicado/vacío, `numero_op` duplicado, edición conservando el plano, agregar/quitar/reordenar con `horasVendidas` intactas y alta inline de cliente.
6. REFACTOR: extraer mapeos de error y precarga sin tocar aserciones; typecheck de los tres workspaces, cero `any`, guardianes de imports, sin builds ni commits.
7. Cerrar con `openspec status --change ordenes-form --json` y `openspec validate ordenes-form --strict`; recién entonces `/opsx:apply`.

## Open Questions

Ninguna bloqueante para gobernanza BAJO. Quedan registrados tres supuestos ya resueltos por decisión: detalle mínimo (D7), precarga canónica sin endpoint de configuración (D5) y `fechaIngreso` informativa (D9). No se reabren las decisiones DU-1..DU-5 de C-06 ni IN-08/C-13 (Excel), ajenas a este change.
