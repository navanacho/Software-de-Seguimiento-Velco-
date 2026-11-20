## Context

C-02 quedó archivado el 2026-11-20 con la migración 001, los modelos Prisma, los tipos TS puros en `packages/domain/src/{configuracion,clientes,ordenes,etapas}/` y los cuatro puertos de repositorio. Los tipos ya disponibles son `Configuracion` (`diasAlertaRiesgo: number`, `porcentajeAvanceRiesgo: number`, `etapasDefault: readonly string[]`), `OrdenTrabajo` (`fechaEntrega: string`, `fechaIngreso: string`, `montoVendido: string`) y `EtapaOrden` (`ordenSecuencia: number`, `completada: boolean`, `horasVendidas: string`). Ninguno de esos archivos contiene hoy una regla de negocio: C-02 las difirió explícitamente a este change (D7 de su design).

C-03 es GATE 3 del camino crítico, governance **MEDIO** y depende de C-02 (completado). Su fuente de verdad es `knowledge-base/05_reglas_de_negocio.md` (§Etapas y avance, §Semáforo de plazo), `knowledge-base/06_funcionalidades.md` HU-05/06/07, `knowledge-base/07_flujos_principales.md` Flujo 2 y 3, DD-03, SU-05 y los principios de producto de `knowledge-base/01_vision_y_objetivos.md`. El MVP lo usa una sola persona, sin autenticación, PIN, RBAC ni tabla `usuarios` (R5, DD-07). Los artefactos se redactan en español rioplatense técnico.

Existe una deuda de fundación que este change DEBE resolver: `backend/test/fundacion/alcance.test.ts` escanea las fuentes vivas (`backend/src`, `frontend/src`, `packages/domain/src`) y exige que no aparezcan `RN-[A-Z]+-\d+` ni `calcularMargen|calcularAvance|calcularSem[aá]foro`. Esa premisa era correcta cuando C-01 era el último change, pero C-03 agrega legítimamente `calcularAvance` y `calcularSemaforo` al dominio y el guardián volverá a fallar. No es un bug de C-03: es una premisa de fundación invalidada por diseño, igual que ocurrió con los ADR al implementar C-02.

## Goals / Non-Goals

**Goals:**

- Implementar `calcularAvance`, `etapaAhora`, `agruparFlujo`, `calcularSemaforo` y `diasRestantes` como funciones puras en `packages/domain/`, con umbrales y zona horaria inyectados por parámetro.
- Respetar la prioridad `Terminado` → `Atrasado` → `En riesgo` → `En plazo`, con comparación a medianoche de `TZ` y sin importar Prisma, Fastify, React ni `exceljs`.
- Definir el DTO de salida con derivados para que C-04 lo sirva y C-05 lo muestre sin recalcular.
- Cubrir RN-SEMAFORO-01..06, RN-AVANCE-01/02, RN-AHORA-01 y RN-FLujo-01 con tests Vitest puros, mínimo dos casos por comportamiento, en ciclo RED → GREEN → TRIANGULATE → REFACTOR (R1, R10).
- Re-encuadrar el guardián de alcance de C-01 sobre sus propios artefactos archivados, sin debilitar aserciones, sin `skip`/`todo` y sin tautologías.
- Mantener `packages/domain/` compilando aunque se eliminen todos los adaptadores por feature (R2) y sin `any` (R9).

**Non-Goals:**

- Endpoints HTTP, handlers Fastify, casos de uso, hooks, queries ni componentes React: todo eso llega en C-04 y C-05.
- Lectura de la fila singleton de configuración: los umbrales se inyectan, no se consultan en este change.
- Reglas de horas, márgenes, desvíos ni exportación: son C-11, C-14 y C-15. `calcularMargen` NO se implementa acá.
- Migraciones, columnas persistidas ni `GENERATED ALWAYS AS (...) STORED` (R3, DD-03).
- Auth/PIN/RBAC, plantillas `.xlsx`, mocks de PostgreSQL, builds, commits ni modificación de `CHANGES.md`.
- Cambiar el significado original del guardián de fundación: sigue verificando que C-01 no creó reglas de negocio; solo deja de aplicarlo al workspace vivo.

## Decisions

### D1 — Funciones puras por feature, con entradas inyectadas

`calcularAvance`, `etapaAhora` y `agruparFlujo` viven en `packages/domain/src/ordenes/`; `calcularSemaforo` y `diasRestantes` viven en `packages/domain/src/costos/` según el scope de `CHANGES.md`, aunque no consuman dinero: el módulo `costos` queda reservado para los derivados económicos de C-11 y hoy solo aloja lógica de plazo. Si la convención de features del repositorio sugiere otro nombre para plazos, se documenta en la implementación sin alterar las firmas ni el significado.

Todas las firmas son puras: reciben los tipos de C-02 y, cuando hace falta, un objeto de contexto con `hoy`, `zonaHoraria`, `diasAlertaRiesgo` y `porcentajeAvanceRiesgo`. No hay `process.env`, reloj implícito (`new Date()` dentro de la función), I/O ni lectura de la configuración. El adaptador de C-04 será quien lea `TZ` y la fila `configuracion` y se los pase.

*Alternativas descartadas:* leer `TZ` con `process.env` dentro del dominio (rompe R2/R4: `process` es Node y el dominio deja de ser portable); usar `Date.now()` internamente (el test no puede fijar `hoy` y el resultado deja de ser determinista); poner los umbrales como constantes (RN-CONFIG-02 exige cambio sin código). *Trade-off:* cada llamada debe construir el contexto, a cambio de funciones deterministas y testeables sin BD.

### D2 — Avance y etapa `ahora`: checklist como única señal

`calcularAvance(etapas)` = `Math.round(100 * completadas / total)`; con `total = 0` devuelve `0` sin lanzar (RN-AVANCE-01, RN-GLOBAL-03). Con todas las etapas completadas devuelve `100` (RN-AVANCE-02). Las etapas se ordenan por `ordenSecuencia` antes de buscar la primera pendiente; `etapaAhora` devuelve la etapa correspondiente o el estado `Todo listo` cuando no hay pendientes (RN-AHORA-01). `agruparFlujo` agrupa las OPs activas por el nombre de esa etapa y excluye tanto a las terminadas como a las que no tienen etapa (HU-06 CA, RN-FLujo-01).

El resultado de `agruparFlujo` es un arreglo ordenado de `{ etapa, cantidad }`, no un `Record`: la tira *"Dónde está cada trabajo ahora"* necesita un orden estable para renderizar y un objeto pierde ese orden de forma implícita.

*Alternativas descartadas:* avance ponderado por `horasVendidas` (DD-03 lo excluye del MVP por falta de respaldo documental); `Math.floor` (subestima el progreso y contradice "redondeado a entero"); contar OPs sin etapas en el flujo con etiqueta `Todo listo` (violaría la CA de HU-06: las OP terminadas no cuentan, y una OP sin etapas no tiene etapa activa). *Trade-off:* todas las etapas pesan igual; limitación conciente ya aceptada en DD-03.

### D3 — Semáforo: prioridad estricta y fechas calendarias en `TZ`

`calcularSemaforo` evalúa en este orden y se detiene en el primer match: (1) `avance = 100` o todas las etapas completadas ⇒ `Terminado`; (2) `hoy > fechaEntrega` ⇒ `Atrasado`; (3) `(fechaEntrega - hoy) <= diasAlertaRiesgo` **y** `avance < porcentajeAvanceRiesgo` ⇒ `En riesgo`; (4) `En plazo`. La prioridad garantiza que una OP terminada con fecha vencida se muestre gris (RN-SEMAFORO-01/05, HU-05 CA).

`diasRestantes` devuelve un entero con signo: positivo si faltan días, `0` si vence hoy, negativo si pasó. La etiqueta de UI (`Faltan N días`, `Vence hoy`, `Pasó hace N días`, `Terminado`) se deriva también en el dominio para que el frontend solo la pinte (RN-SEMAFORO-06, RN-GLOBAL-02).

La comparación es de **fechas calendarias**, no de timestamps: `fechaEntrega` es `YYYY-MM-DD` y `hoy` se convierte a `YYYY-MM-DD` en la zona `zonaHoraria` usando `Intl.DateTimeFormat` con `formatToParts` (sin depender del locale ni del `TZ` del proceso). Restar marcas de tiempo en milisegundos es incorrecto porque el horario de verano cambia la duración del día; `Date.parse('YYYY-MM-DD')` es incorrecto porque interpreta la fecha como UTC y puede desplazar el semáforo un día (SU-05).

*Alternativas descartadas:* comparar `Date.now()` contra `Date.parse(fechaEntrega)` (depende del reloj del host y del TZ del proceso: exactamente el riesgo de SU-05); restar `getTime()` y dividir por 86400000 (DST de `America/Argentina/Mendoza` rompe el conteo); dejar el formateo de la etiqueta en React (duplica la regla y viola RN-GLOBAL-02). *Trade-off:* `Intl` es estándar de ECMAScript y no requiere dependencias, pero hay que fijar `zonaHoraria` explícitamente en cada llamada; el test usa dos zonas para demostrar que el resultado cambia con el parámetro y no con el entorno.

### D4 — DTO de salida aplanado y de un solo dueño

El DTO se define en `packages/domain/src/ordenes/` y se reexporta desde `packages/domain/src/index.ts`. Expone, junto a los datos de la OP, los campos derivados `avance`, `semaforo`, `diasRestantes`, `etapaAhora` y `etiquetaPlazo`, más la información mínima que la tarjeta necesita (número de OP, cliente, pieza y etapas con su estado). Los campos quedan aplanados, no dentro de un subobjeto `derivados`: C-04 y C-05 consumen directamente la tarjeta y un nivel extra obligaría a desarmar el contrato en dos capas.

La construcción del DTO es una función pura que compone `calcularAvance`, `etapaAhora`, `calcularSemaforo` y `diasRestantes`; es la única entrada válida para API y frontend. Ningún componente ni handler vuelve a calcular estos valores (RN-GLOBAL-02, C-04/C-05 del roadmap).

*Alternativas descartadas:* definir el DTO en `backend/src/features/ordenes/` (el frontend tendría que duplicarlo o importar desde backend, rompiendo `paquete-dominio-compartido`); dejar que React derive `semaforo` a partir de `fechaEntrega` (dos fuentes de verdad, el error original que DD-03 quiso eliminar); un campo `derivados` anidado (más capas sin beneficio funcional). *Trade-off:* el DTO acopla en un solo contrato los derivados de plazo y los datos de tarjeta, pero ese es justamente el límite de HU-05.

### D5 — Re-encuadre del guardián de alcance de C-01

El guardián se re-encuadra con estos principios:

1. **Cambia el objeto inspeccionado, no la aserción.** Las comprobaciones `not.toMatch(/RN-[A-Z]+-\d+/)` y `not.toMatch(/calcularMargen|calcularAvance|calcularSem[aá]foro/)` se aplican a los artefactos Markdown del change archivado `openspec/changes/archive/2026-11-20-velco-mvp-foundation/`, que ya se leen en el propio archivo (`propuesta`, `diseno`, `tareas`, `especificacion` y el resto de `.md`). Se elimina su aplicación a `fuentes`, porque las fuentes vivas ya no son un espejo de C-01: contienen código de C-02 y, a partir de este change, las reglas de C-03.
2. **Se preservan las aserciones originales sobre el archive**, incluidas las cadenas literales que verifican que la propuesta dijera "sin modelos de negocio", que el diseño dijera "no define modelos de negocio", que no hubiera `codigoArchivado` y que no apareciera código de implementación. No se afloja ninguna expresión regular ni se cambia un `not.toMatch` por un `toContain`.
3. **No se usa `skip`, `todo`, `only` ni comentarios que desactiven el test.** El nombre del caso se renombra para declarar el nuevo alcance (por ejemplo, *"el change archivado de fundación no crea reglas de negocio, modelos de dominio ni migraciones"*) y los mensajes de `expect` nombran el artefacto archivado. Así la intención queda documentada en el propio test sin depender de comentarios.
4. **No se introduce una tautología.** No se reemplaza la prohibición por una aserción del tipo `expect(fuentes.length > 0).toBe(true)` sobre el mismo conjunto que se está dejando de inspeccionar, ni por `expect(true).toBe(true)`. La verificación sigue siendo falsable: si alguien edita la propuesta archivada de C-01 para introducir `calcularAvance`, el test debe fallar.
5. **Los otros dos casos del archivo quedan intactos:** el que prohíbe auth/PIN/RBAC y `.xlsx` nuevos en fuentes vivas sigue siendo vigente (C-03 no agrega ninguno), y el que valida el índice de ADR con HU-19/Fase 2/Admin-Oficina/sin montos sigue apuntando al archive de C-01.

La presencia real de las reglas nuevas NO se prueba dentro del guardián de fundación: se prueba en la suite pura de C-03. Cada test cumple una responsabilidad distinta y ninguno puede "pasar" gracias al otro.

*Alternativas descartadas:* borrar el guardián (pierde la trazabilidad de C-01); agregar `calcularAvance`/`calcularSemaforo` a una lista de excepciones en la expresión regular (debilita la aserción y la vuelve dependiente de la cantidad de changes futuros); excluir `packages/domain/src` de `fuentes` (C-02 ya lo incluía y seguiría prohibiendo `RN-XX` en tipos legítimos); marcar el test con `skip` (prohíbe R1 y oculta la deuda); reescribir la aserción como "las fuentes vivas SÍ contienen derivados" (cambia el propósito del guardián y crea una tautología con la suite de C-03). *Trade-off:* el guardián deja de defender el workspace vivo contra reglas de negocio no planeadas, pero ese rol lo cubren ahora el code review, el typecheck y la suite de C-03; lo que sí conserva es la verdad histórica sobre C-01.

### D6 — TDD como secuencia verificable en las tareas

Las tareas se agrupan por comportamiento y cada grupo explicita el gate: RED (test que falla), GREEN (implementación mínima), TRIANGULATE (segundo caso, y cuando aplica un tercero de borde como OP sin etapas u OP terminada vencida) y REFACTOR (sin cambiar aserciones). Cada comportamiento tiene al menos dos casos antes de refactorizar, y cada test referencia su `RN-XX-NN` (RN-GLOBAL-04). Los tests son puros: no importan `@testcontainers/postgresql`, no levantan BD y viven junto a la feature en `packages/domain/` (R10).

*Alternativas descartadas:* escribir los cinco tests y luego implementar todo de una vez (no evidencia RED por regla y rompe R1); un único test por función (no triangula); tests en `backend/test/` (mezcla dominio con infraestructura y rompe la organización de `fundacion-testing`). *Trade-off:* más tareas chicas y más ejecuciones de Vitest, a cambio de evidencia de TDD para governance MEDIO.

### D7 — Runner de Vitest para el paquete de dominio

`@velco/domain` hoy solo declara el script `typecheck` en `package.json` y no tiene `vitest.config.ts`; el único runner del repo es `backend/vitest.config.ts`, cuyo `include` es `['src/**/*.test.ts', 'test/**/*.test.ts']` relativo a `backend/`. Por lo tanto los tests puros de C-03 NO correrían con la configuración actual. Este change agrega en `packages/domain/` un `vitest.config.ts` con `environment: 'node'` e `include: ['src/**/*.test.ts']`, declara `vitest` 5.1.1 como dependencia de desarrollo del workspace y expone `"test": "vitest run"` en su `package.json`. El script `test` del `package.json` raíz ya hace `npm run test --workspaces --if-present`, así que los tests de dominio pasan a ejecutarse automáticamente en `npm test` sin tocar el runner de backend.

*Alternativas descartadas:* ampliar el `include` de `backend/vitest.config.ts` con `../packages/domain/src/**/*.test.ts` (hace que el dominio dependa de la configuración de backend y rompe el aislamiento de C-02); poner los tests en `backend/test/estado-y-avance-domain/` (contradice la spec `fundacion-testing`: las reglas puras y sus pruebas quedan junto a la feature en `packages/domain/`); no tener runner y ejecutar los tests a mano con `npx` (no es repetible ni auditable). *Trade-off:* un archivo de configuración y una dependencia de desarrollo más en el workspace de dominio, a cambio de que los tests puros sean ejecutables desde la raíz y no arrastren PostgreSQL.

### D8 — Guardián adicional de ubicación de reglas sobre fuentes vivas

D5 conserva la verdad histórica sobre C-01 y deja `backend/test/fundacion/alcance.test.ts` intacto. Para no perder la defensa del workspace vivo, este change crea AHORA, antes del archive, el guardián adicional `backend/test/fundacion/ubicacion-reglas.test.ts` como requisito nuevo de `fundacion-testing` dentro del mismo C-03. La aserción se INVIERTE respecto de D5: ya no se prohíbe que existan derivados en el workspace, sino que las definiciones de `calcularAvance`, `calcularSemaforo`, `calcularMargen`, `diasRestantes`, `agruparFlujo` y `etapaAhora` —tanto con `function nombre(` como con `const|let|var nombre =` y arrow— deben estar exclusivamente bajo `packages/domain/src/`. El guardián inspecciona `backend/src`, `frontend/src` y `packages/domain/src`, excluye `*.test.ts`/`*.test.tsx` para no reportar las citas RN legítimas de la suite de tests (D6) y exige que el conjunto de definiciones encontradas sea no vacío para evitar una aserción tautológica. `calcularMargen` entra hoy en la regex negativa (detección de definición fuera del dominio) y NO en la aserción positiva: recién aparecerá como definición real en C-11. Con este guardián, `alcance.test.ts` queda intacto y no se restaura el loop eliminado.

*Alternativas descartadas:* restaurar el loop eliminado de `alcance.test.ts` (reviviría la premisa de C-01 y volvería a romperse en C-03); agregar excepciones por nombre de función (debilita la aserción y la hace crecer con cada change); incluir tests en el escaneo (falsos positivos de RN); exigir hoy una definición de `calcularMargen` (falla prematuramente porque C-11 todavía no existe). *Trade-off:* el guardián conoce la lista de nombres de reglas y habrá que ampliarla cuando lleguen nuevas reglas, a cambio de falsar movimientos de código fuera del dominio sin tocar el guardián histórico.

## Risks / Trade-offs

- **[SU-05 sin confirmación humana sobre la zona real de Velco] →** `zonaHoraria` viaja como parámetro y los tests usan dos zonas distintas; cambiar `TZ` en C-04 no obliga a tocar el dominio. La confirmación con el gerente sigue pendiente y se registra como Open Question, no se resuelve silenciosamente.
- **[Prioridad del semáforo mal ordenada] →** un único punto de decisión con `return` anticipado en el orden de RN-SEMAFORO-05, más un caso de regresión explícito: OP terminada con fecha vencida debe dar `Terminado`.
- **[Diferencia de un día por DST o por UTC] →** comparación de `YYYY-MM-DD` con `Intl.formatToParts` y `zonaHoraria` inyectada; casos límite "vence hoy" y "pasó hace 1 día" con dos zonas.
- **[El frontend recalcule los derivados] →** DTO aplanado con todas las etiquetas listas, sin exponer las reglas como helpers de UI; C-05 queda prohibido de importar lógica de cálculo.
- **[El guardián vuelva a romperse con C-11] →** al llegar `calcularMargen`, el guardián ya no escanea fuentes vivas; la suite de C-11 cubrirá esa regla. Se documenta aquí para que el cambio futuro no reintroduzca la premisa de C-01.
- **[Deuda mal resuelta por debilitamiento] →** revisión explícita de los cinco puntos de D5 antes de cerrar la tarea: mismas regex, mismas cadenas literales, sin `skip`, sin tautología y los otros dos casos del archivo intactos.
- **[Fricción entre `CHANGES.md` y `packages/domain/src/costos/`] →** el scope nombra `domain/costos` para `calcularSemaforo`/`diasRestantes`; se respeta el scope literal aunque hoy no haya dinero en esas funciones, y se explica en D1 para evitar una "corrección" posterior.
- **[Tipos de C-02 insuficientes para el DTO] →** reutilizar `OrdenTrabajo`, `EtapaOrden` y `Configuracion` sin modificarlos; el DTO es un tipo nuevo aditivo y cualquier campo faltante se agrega al DTO, no a las tablas (R3).

## Migration Plan

No hay migración de base de datos ni datos que convertir: C-03 es dominio puro y los derivados siguen sin persistirse.

1. Confirmar C-02 archivado, los tipos de C-02 presentes y `openspec list --json` sin changes activos además de este.
2. RED: escribir primero los tests puros de avance, `ahora`, flujo, semáforo y días restantes, con `hoy` y umbrales fijos; ejecutar Vitest y confirmar que fallan por funciones inexistentes.
3. GREEN: implementar lo mínimo para cada regla, reexportar desde `index.ts` y ejecutar los tests después de cada grupo.
4. TRIANGULATE: agregar el segundo caso de cada regla y los de borde (`OP sin etapas ⇒ avance 0`, `OP terminada con fecha vencida ⇒ Terminado/gris`, dos zonas horarias), ejecutando tests en cada gate.
5. REFACTOR: extraer helper de fecha calendaria y de construcción del DTO sin tocar aserciones; repetir la suite.
6. Re-encuadrar el guardián según D5: primero confirmar que falla con las funciones ya presentes (RED del guardián), luego aplicar el nuevo alcance sobre el archive de C-01 (GREEN) y verificar los tres casos del archivo.
7. Verificar `npm run typecheck -w @velco/domain`, la búsqueda de imports prohibidos, la compilación sin adaptadores y `npm test` de la suite pura; sin builds ni commits.
8. Cerrar con `openspec validate estado-y-avance-domain --strict`; el checkbox de `CHANGES.md` se marca recién al archivar (R8).

## Open Questions

- **SU-05 (Media, no bloqueante):** confirmar con el gerente si la zona horaria efectiva es `America/Argentina/Mendoza`. El diseño la inyecta, así que responderla no cambia el dominio.
- **[Trazabilidad, resuelta en D5 y D8]:** el guardián de fundación pasa a custodiar el archive de C-01; el guardián adicional sobre fuentes vivas quedó creado como D8 y requisito nuevo de `fundacion-testing`, no como excepción dentro de este change.
- **IN-08 (Alta, spike C-13) y DD-07 (Alta):** siguen diferidos; no tienen impacto en este change y no se resuelven silenciosamente.
