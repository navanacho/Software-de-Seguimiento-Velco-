## 1. Decimal exacto en el dominio (TDD)

- [x] 1.1 RED: escribir tests puros en `packages/domain/src/decimal/` para sumar, restar, multiplicar y comparar cadenas decimales con escala 2 (horas, importes y `% Consumo`) y 4 solo para cantidades de materiales, sin `number`
- [x] 1.2 GREEN: implementar el tipo `Decimal` y las operaciones exactas sobre `bigint`, sin redondeo comercial ni `Math.round`/`toFixed`
- [x] 1.3 TRIANGULATE: cubrir negativos, cero, ceros a la derecha, desbordamiento de escala y la reutilización de `calcularConsumoHoras` con resultados de 2 decimales, incluida una división no terminada, sin reimplementar la fórmula
- [x] 1.4 REFACTOR: exportar desde `packages/domain/src/index.ts` y verificar `npm run typecheck -w @velco/domain` sin `any` (R9)

## 2. Comparativa por etapa (TDD)

- [x] 2.1 RED: escribir tests puros en `packages/domain/src/horas/` para RN-HORAS-01..04, RN-HORAS-06 y RN-HORAS-07, incluyendo horas sin etapa y horas vendidas cero
- [x] 2.2 GREEN: implementar `comparativaPorEtapa` reutilizando `calcularHorasVendidasTotales`, `calcularHorasRealesTotales`, `calcularDesvioHoras`, `calcularConsumoHoras` y `evaluarAlertaDesvio`, con el bucket final `Sin etapa` y el umbral fijo de 15 de `evaluarAlertaDesvio` (sin cambio de firma, RN-GLOBAL-02)
- [x] 2.3 TRIANGULATE: cubrir etapa sin partes, alerta en el límite estricto de 15 puntos, reales mayores que vendidas y OP sin etapas ni partes
- [x] 2.4 REFACTOR: comprobar que no se reimplementó ninguna fórmula de horas y que no se persiste ningún resultado (R2, R3)

## 3. Costos de materiales y margen real (TDD)

- [x] 3.1 RED: escribir tests puros en `packages/domain/src/margen/` para RN-MARGEN-01..06: `COALESCE` por ítem, agregado cotizado, margen positivo y negativo, tasa global cero y decimal exacto sin redondeo en el dominio
- [x] 3.2 GREEN: implementar `costoMaterialReal`, `costoMaterialesCotizado`, `margenReal` y `tasaGlobalNoConfigurada` con `valorHoraEstandar: Decimal` inyectado desde `ContextoTarjeta`
- [x] 3.3 TRIANGULATE: cubrir tasa vigente cambiada (IN-02), OP sin materiales, cantidad con cuatro decimales, todos los costos reales nulos y tasa cero con advertencia (Flujo 5)
- [x] 3.4 REFACTOR: verificar que el módulo no importa Prisma, Fastify, React ni `exceljs` y que no consulta PostgreSQL (R2, R10)

## 4. Modelo de planilla compartido (TDD)

- [x] 4.1 RED: escribir tests del modelo con `incluirMargenes: true` y `false`, verificando que la variante operativa no contiene margen ni costos (RN-EXPORT-04/05/06)
- [x] 4.2 GREEN: implementar `construirModeloPlanilla` en `packages/domain/src/exportacion/` con unión discriminada por `variante` y claves semánticas derivadas del dominio
- [x] 4.3 TRIANGULATE: construir el modelo sin plantillas `.xlsx`, sin `EXCEL_TEMPLATES_DIR`, sin rangos de celda hardcodeados y sin acceso a filesystem (R6, DD-11, IN-08)
- [x] 4.4 REFACTOR: eliminar adaptadores por feature en un entorno de verificación y confirmar que `packages/domain/` sigue compilando sin `exceljs` (R2)

## 5. DTOs canónicos y transporte (TDD)

- [x] 5.1 RED: escribir tests puros del constructor del detalle con `comparativaPorEtapa`, ambos agregados de materiales, `margenReal` y `tasaGlobalNoConfigurada` (HU-14/15/16)
- [x] 5.2 GREEN: ampliar `DetalleOpDTO` y su constructor en el dominio con los campos derivados, alimentados por la tasa inyectada de C-10 sin nuevos endpoints
- [x] 5.3 TRIANGULATE: espejar los tipos en `frontend/src/shared/domain-client/` con `z.ZodType<DetalleOpDTO>`, `null` en el porcentaje con vendidas cero y tasa cero sin excepción (R9, RN-HORAS-06)
- [x] 5.4 REFACTOR: comprobar que los handlers no calculan derivados y que `schema.prisma` y las migraciones no incorporan columnas (R3, RN-GLOBAL-02)

## 6. Trazabilidad de reglas y regresión (TDD)

- [x] 6.1 RED: armar la matriz de cobertura RN-HORAS-01..07 y RN-MARGEN-01..06 con al menos dos casos por regla y etiqueta RN en cada test (RN-GLOBAL-04)
- [x] 6.2 GREEN: completar los casos faltantes de la matriz sin agregar lógica de producción nueva
- [x] 6.3 TRIANGULATE: verificar la tasa global diferida de IN-02, el umbral de 15 puntos y la no duplicación de nombres de funciones de C-08
- [x] 6.4 REFACTOR: ejecutar la suite de dominio y los typechecks de dominio, backend y frontend sin correr build ni iniciar PostgreSQL (R1, R10)

## 7. Verificación del change

- [x] 7.1 Ejecutar tests de dominio, backend y frontend y los typechecks de los tres workspaces (sin build)
- [x] 7.2 Ejecutar `openspec validate desvios-y-margen-domain --strict` y revisar que los cinco delta specs sean sincronizables
- [x] 7.3 Registrar en `apply-progress.md` la evidencia RED/GREEN/TRIANGULATE/REFACTOR de cada grupo y los comandos ejecutados
