## 1. PreparaciÃ³n, safety net y checkpoint de decisiones

- [x] 1.1 Verificar punto de partida: C-06 y C-07 archivados, `openspec list --json` con solo `horas-reales-api` activo y `CHANGES.md` con C-08 en `[ ]` (R8)
- [x] 1.2 Leer `CHANGES.md` Â§C-08, `knowledge-base/04` Â§registros_horas, `05` Â§Horas, `06` HU-10/HU-13, `07` Flujo 4, `09` DD-07 y los dos documentos canÃ³nicos antes de tocar cÃ³digo
- [x] 1.3 Ejecutar sin modificarlos los suites de `packages/domain` y `backend` y capturar el resultado como safety-net baseline (D8)
- [x] 1.4 Confirmar en el cÃ³digo real el placeholder `horas: readonly never[]` de `DetalleOpDTO`, el `z.array(z.never())` de `DetalleOpSchema`, la ausencia de feature `horas` y las migraciones 001/002 intactas
- [x] 1.5 Checkpoint 1 (gobernancia MEDIO) cumplido el 2026-11-22: el usuario confirmÃ³ P-1 = A, P-2 = A, P-3 = A, P-4 = A, P-5 = A y P-6 = B; decisiones, alternativas elegidas y justificaciones registradas en `design.md` Â§Open Questions antes de escribir tests de producciÃ³n
- [x] 1.6 Confirmar que P-6 = B deja `TarjetaOrdenDTO` y `GET /api/ops` (`api-listado-ops`) intactos en C-08; C-09 obtendrÃ¡ los totales del detalle o de `GET /api/ops/:id/horas`, sin enmendar specs de tablero (R8)
- [x] 1.7 Crear la estructura `backend/src/features/horas/{application/ports,application,http,prisma}/` y `packages/domain/src/horas/` sin cÃ³digo de producciÃ³n todavÃ­a (D3, D4)

## 2. MigraciÃ³n 003, modelo Prisma e integridad â€” RED â†’ GREEN â†’ TRIANGULATE â†’ REFACTOR

- [x] 2.1 RED: test de integraciÃ³n que falla porque `registros_horas` no existe, usando `crearContenedorPostgres()` con `postgres:18.7` (spec `modelo-datos-horas`, R1, R10)
- [x] 2.2 RED: tests que exigen rechazo de `horas = 0` y `horas = -1.00` por `CHECK (horas > 0)` (â‰¥2 casos, RN-HORAS-05)
- [x] 2.3 GREEN: crear `backend/prisma/migrations/003_registros_horas/migration.sql` con columnas, FKs `CASCADE`/`SET NULL`, `CHECK`, `created_at`, `observacion TEXT NULL` (P-1) y los tres Ã­ndices, sin `usuario_id` ni derivados (DD-07, R3, R5)
- [x] 2.4 GREEN: declarar `model RegistroHora` en `backend/prisma/schema.prisma` con `Decimal @db.Decimal(6,2)`, `@db.VarChar(100)`, `@db.Date`, `observacion String? @db.Text` (P-1) y relaciones `onDelete: Cascade` / `SetNull`
- [x] 2.5 TRIANGULATE: borrar OP con partes (CASCADE), borrar etapa con partes (SET NULL sin pÃ©rdida de `horas`), insertar parte sin etapa e insertar parte con y sin `observacion` (â‰¥3 casos, P-1)
- [x] 2.6 TRIANGULATE: verificar los Ã­ndices `(orden_id, fecha)`, `(etapa_id)`, `(operario)`, que 001/002 no cambiaron y que no aparecen `usuario_id`, `Float` ni columnas derivadas
- [x] 2.7 RED: test que falla al leer/escribir `horas` como cadena decimal exacta con dos decimales (spec `puertos-persistencia-horas`)
- [x] 2.8 GREEN: convertir `Prisma.Decimal` â†” `string` en el adaptador sin `parseFloat`, `toNumber` ni `number` (RN-MARGEN-05, R9)
- [x] 2.9 REFACTOR: ejecutar `prisma generate` con Prisma 7.10.1 y typecheck del backend; sin builds ni commits

## 3. Reglas puras de horas en dominio â€” RED â†’ GREEN â†’ TRIANGULATE â†’ REFACTOR

- [x] 3.1 RED: test que exige el contrato inmutable `RegistroHora` y el validador puro en `packages/domain/src/horas/`, fallando por mÃ³dulo ausente (spec `derivados-horas-reales`, R1)
- [x] 3.2 GREEN: contrato con `horas` como `string`, `etapaId: string | null` y `observacion?: string | null` (P-1), sin imports de frameworks ni `any` (R2, R9)
- [x] 3.3 GREEN: validador puro que rechaza `horas <= 0`, operario vacÃ­o y fecha invÃ¡lida (RN-HORAS-05)
- [x] 3.4 TRIANGULATE: parte con etapa, parte sin etapa, horas cero, horas negativas y operario vacÃ­o (â‰¥4 casos)
- [x] 3.5 RED: test que exige `calcularHorasRealesTotales` con suma exacta, fallando por funciÃ³n ausente (RN-HORAS-01)
- [x] 3.6 GREEN: implementar con centÃ©simas/`bigint` siguiendo `materiales/agregados.ts`, sin coma flotante (RN-MARGEN-05)
- [x] 3.7 TRIANGULATE: suma de tres partes (`2.50 + 1.25 + 0.75 = 4.50`), lista vacÃ­a (`0.00`) y dos decimales exactos (â‰¥2 casos)
- [x] 3.8 RED: test que exige `calcularDesvioHoras` reutilizando `calcularHorasVendidasTotales`, sin reimplementar la suma de vendidas (RN-HORAS-02)
- [x] 3.9 GREEN: desvÃ­o positivo (ahorro) y negativo (pÃ©rdida) como cadenas decimales
- [x] 3.10 TRIANGULATE: vendidas `4.00`/reales `3.00` â‡’ `1.00`; reales `5.00` â‡’ `-1.00`; sin partes â‡’ desvÃ­o igual a vendidas
- [x] 3.11 RED: test que exige `calcularConsumoHoras` y `null` cuando vendidas = 0, sin excepciÃ³n (RN-HORAS-03, RN-HORAS-06)
- [x] 3.12 GREEN: consumo exacto (`3.75 / 4.00 â‡’ 93.75`) y rama de divisiÃ³n por cero
- [x] 3.13 RED: test que exige `evaluarAlertaDesvio` con umbral avance + 15 y con `reales > vendidas` (RN-HORAS-04)
- [x] 3.14 GREEN: activar alerta por consumo y por exceso de horas, sin consultar fechas ni configuraciÃ³n
- [x] 3.15 TRIANGULATE: consumo 95 con avance 80 (alerta), 93.75 con avance 80 (sin alerta), vendidas 0 con reales 1 (alerta), fecha lejana con exceso (alerta)
- [x] 3.16 REFACTOR: exportar contrato y funciones desde `packages/domain/src/index.ts`, verificar cero imports de frameworks y `RN-XX-NN` en los tÃ­tulos (RN-GLOBAL-04)

## 4. Puertos y adaptadores de horas â€” RED â†’ GREEN â†’ TRIANGULATE â†’ REFACTOR

- [x] 4.1 RED: test de tipado que exige `RegistroHoraRepository` en `backend/src/features/horas/application/ports/`, fallando por mÃ³dulo ausente (spec `puertos-persistencia-horas`, R1)
- [x] 4.2 GREEN: interfaz con `crear`, `listarPorOrden`, `buscarPorId`, `actualizar` y `eliminar`, tipos estrictos y sin `any` (R9)
- [x] 4.3 GREEN: puerto `UnidadTrabajoHoras` con `{ horas, ops, etapas }`, sin extender ni modificar `UnidadTrabajoOps` (D3)
- [x] 4.4 RED: test de integraciÃ³n que falla si la escritura de un parte no se revierte al fallar el paso siguiente (R10)
- [x] 4.5 GREEN: `PrismaUnidadTrabajoHoras` usando `PrismaClient.$transaction` y `Prisma.TransactionClient` solo en `horas/prisma/`
- [x] 4.6 GREEN: `PrismaRegistroHoraRepository` sin reglas de negocio, sin cÃ³digos HTTP y sin cÃ¡lculo de derivados (R2, R3)
- [x] 4.7 TRIANGULATE: repositorios enlazados, rollback real y lectura de decimal exacto desde la transacciÃ³n (â‰¥2 casos)
- [x] 4.8 RED: guardiÃ¡n que falla si `packages/domain/src/` importa Fastify/Prisma/React/`exceljs` o si aparece `any` en los puertos (R2, R9)
- [x] 4.9 REFACTOR: eliminar temporalmente los adaptadores en un check de compilaciÃ³n y confirmar que `packages/domain/` sigue compilando (R2); typecheck sin errores

## 5. API de alta y listado de partes â€” RED â†’ GREEN â†’ TRIANGULATE â†’ REFACTOR

- [x] 5.1 RED: tests de esquemas Zod que fallan por ausencia de `BodyAltaHoraSchema`, exigiendo 422 para `horas: '0'` y `'-1.00'` (spec `registros-horas-api`, R1)
- [x] 5.2 GREEN: esquemas `.strict()` en `horas/http/esquemas.ts` con `horas` como cadena positiva, `fecha` `YYYY-MM-DD` vÃ¡lida y editable en PATCH, `operario` 1..100, `etapaId` UUID opcional, `observacion` opcional (P-1), rechazo de cuerpo vacÃ­o en PATCH (P-4) y de derivados; mapear a `{ error: 'validation_error', details }` con 422 (R9)
- [x] 5.3 TRIANGULATE: horas cero, horas negativas, fecha `2027-02-30`, UUID invÃ¡lido, campo `horasTotales` rechazado, cuerpo vacÃ­o en PATCH rechazado y `observacion` aceptada como texto/`null`/ausente (â‰¥4 casos, P-1, P-4)
- [x] 5.4 RED: test del caso de uso `imputarHoras` que falla por mÃ³dulo ausente y exige 404 si la OP no existe (Flujo 4)
- [x] 5.5 GREEN: `imputarHoras` en `horas/application/` validando con la regla pura, comprobando OP con `ops` y persistiendo vÃ­a `UnidadTrabajoHoras` (R2)
- [x] 5.6 RED: test de integraciÃ³n de `POST /api/ops/:id/horas` con etapa y sin etapa, fallando por ruta ausente (HU-10, RN-HORAS-05)
- [x] 5.7 GREEN: registrar la ruta con Fastify 5.12.8 usando el caso de uso, sin auth y sin `usuarioId` (DD-07, R5)
- [x] 5.8 TRIANGULATE: alta con etapa, alta con `etapaId: null`, OP inexistente (404) y etapa inexistente o de otra OP rechazada con 422 `validation_error` y `details[].path = ['etapaId']` (P-3); verificar que el cuerpo del alta es solo el `ParteHoraDTO` (P-5)
- [x] 5.9 RED: test que exige `GET /api/ops/:id/horas` ordenado por `fecha` y `created_at`, fallando por ruta ausente
- [x] 5.10 GREEN: caso de uso de listado y ruta HTTP con `horas` como cadena decimal y 404 para OP inexistente
- [x] 5.11 TRIANGULATE: dos partes en fechas distintas, OP sin partes y OP inexistente (â‰¥2 casos)
- [x] 5.12 REFACTOR: extraer el mapeo de errores de frontera sin tocar aserciones; verificar que ningÃºn handler calcula derivados (RN-GLOBAL-02)

## 6. CorrecciÃ³n, baja y recÃ¡lculo â€” RED â†’ GREEN â†’ TRIANGULATE â†’ REFACTOR

- [x] 6.1 RED: tests de `PATCH /api/ops/:id/horas/:horaId` que fallan por ruta ausente, exigiendo actualizaciÃ³n parcial (solo campos presentes), `fecha` editable, rechazo de cuerpo vacÃ­o con 422 y respuesta `ParteHoraDTO` (P-4, P-5, HU-13, R1)
- [x] 6.2 GREEN: caso de uso de correcciÃ³n con validaciÃ³n pura y persistencia vÃ­a `UnidadTrabajoHoras`
- [x] 6.3 TRIANGULATE: corregir `2.50 â‡’ 3.00`, corregir parte sin etapa, corregir solo `fecha`, corregir/limpiar `observacion`, conservar campos ausentes y rechazar `0`/negativo conservando el valor original (â‰¥2 casos, P-1, P-4)
- [x] 6.4 RED: test que exige 404 para `horaId` inexistente y para `horaId` de otra OP (â‰¥2 casos)
- [x] 6.5 GREEN: comprobaciÃ³n de pertenencia en el caso de uso y error `not_found` en la frontera
- [x] 6.6 RED: test que exige `DELETE /api/ops/:id/horas/:horaId` y recÃ¡lculo, fallando por ruta ausente
- [x] 6.7 GREEN: caso de uso de baja y ruta HTTP, sin tocar OP ni etapas
- [x] 6.8 TRIANGULATE: eliminar un parte entre varios, eliminar el Ãºnico parte (`0.00`), verificar derivados recalculados desde la colecciÃ³n fresca y que la respuesta es `{ ok: true }` (â‰¥2 casos, P-5)
- [x] 6.9 REFACTOR: unificar la reconstrucciÃ³n de derivados de alta/ediciÃ³n/baja en una sola llamada a las funciones de dominio (RN-GLOBAL-02, R3)

## 7. Detalle de OP, esquemas y Swagger â€” RED â†’ GREEN â†’ TRIANGULATE â†’ REFACTOR

- [x] 7.1 RED: test que exige `DetalleOpDTO.horas` con partes reales y falla mientras sea `readonly never[]` (spec `api-detalle-op`, R1)
- [x] 7.2 GREEN: definir `ParteHoraDTO` (con `observacion` opcional, P-1) y cambiar `DetalleOpDTO.horas` a `ParteHoraDTO[]`, con `horasRealesTotales`, `desvioHoras`, `porcentajeConsumo` y `alertaDesvio` como campos hermanos calculados en dominio, sin objeto `{ partes, totales }` (P-2, R3)
- [x] 7.3 GREEN: `obtenerOp` inyecta el repositorio de horas, carga los partes y compone los derivados con las funciones puras de dominio (D4, D6)
- [x] 7.4 GREEN: `DetalleOpSchema` usa `z.array(ParteHoraSchema)` y `z.toJSONSchema` actualiza Swagger, sin texto "pendiente de C-08" (R9)
- [x] 7.5 TRIANGULATE: detalle con partes, sin partes, con vendidas cero (`consumo: null`), con partes sin etapa y con `observacion` cargada y `null` (â‰¥3 casos, P-1, P-2)
- [x] 7.6 RED: guardiÃ¡n que falla si un handler calcula totales, desvÃ­os o consumo, o si se escribe algÃºn derivado en PostgreSQL (R2, R3, RN-GLOBAL-02)
- [x] 7.7 REFACTOR: revisar que ningÃºn spec archivado ni `openspec/config.yaml` fue modificado y que los deltas cubren los seis capabilities (R8)

## 8. VerificaciÃ³n final y cierre del propose

- [x] 8.1 Ejecutar los suites completos de `packages/domain` y `backend` y compararlos con el safety-net de 1.3 (D8)
- [x] 8.2 Ejecutar typecheck estricto de los workspaces afectados: cero `any`, cero imports de frameworks en dominio, componentes React en PascalCase (R2, R9)
- [x] 8.3 Verificar guardianes de alcance: cero auth/PIN/RBAC, cero `usuario_id`, cero derivados persistidos, cero Excel, cero mocks de PostgreSQL y cero builds/commits (R3, R5, R6, R10)
- [x] 8.4 Confirmar que los seis delta specs (`modelo-datos-horas`, `puertos-persistencia-horas`, `derivados-horas-reales`, `registros-horas-api`, `api-detalle-op`, `dto-derivados-orden`) tienen escenarios para todos los casos obligatorios (HU-10, HU-13, Flujo 4)
- [x] 8.5 Verificar que los tests y los specs no contienen decisiones pendientes y que `design.md` conserva el registro histÃ³rico de P-1..P-6 ya cumplido en 1.5
- [x] 8.6 Ejecutar `openspec status --change horas-reales-api --json` y confirmar `isComplete: true`, `applyRequires` satisfechos y los cuatro artefactos en `done` (R8)
- [x] 8.7 Ejecutar `openspec validate horas-reales-api --strict` y confirmar "Change 'horas-reales-api' is valid"; entonces el change queda apply-ready para `/opsx:apply horas-reales-api`



