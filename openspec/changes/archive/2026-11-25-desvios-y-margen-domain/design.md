## Context

C-01..C-10 dejaron `packages/domain` con reglas puras de estado y horas, el DTO canónico `TarjetaOrdenDTO`/`DetalleOpDTO` construido en dominio y la fila singleton de `configuracion` con su tasa vigente inyectada en `ContextoTarjeta.valorHoraEstandar`. El spec `configuracion-en-lectura-op` prohíbe explícitamente calcular `margen` en C-10 y lo difiere a C-11. Hoy no existe la comparativa por etapa, el agregado de materiales con `COALESCE`, el margen real ni el modelo de planilla compartido: C-12 (UI) y C-14/C-15 (exportación) los necesitan como reglas puras y reutilizables (HU-14/15/16, Flujo 5, Flujo 6, RN-GLOBAL-02, DD-04, DD-05, DD-08).

## Goals / Non-Goals

**Goals:**

- Producir en dominio, con una sola implementación, los derivados de desvío por etapa, costos de materiales y margen real usando decimal exacto.
- Reutilizar —no duplicar— las reglas de horas de C-08 y la tasa global inyectada por C-10, sin leer PostgreSQL ni persistir resultados.
- Definir el modelo puro de la planilla compartido por las dos variantes de `exportOp`.
- Ampliar los DTOs canónicos para que API y frontend transporten los derivados sin recalcularlos.
- Verificar cada regla con Vitest en ciclo RED → GREEN → TRIANGULATE → REFACTOR.

**Non-Goals:**

- Auth, PIN, RBAC o tabla `usuarios` (R5; HU-19 es Fase 2).
- Cálculo, alertas o formato en componentes React ni nuevos endpoints HTTP (C-12).
- Migraciones, columnas derivadas, instantáneas de tasa ni acceso a `configuracion` desde el dominio (R3, DD-04).
- Lectura o escritura de archivos, generación de workbooks ni dependencia de `exceljs` (R2, R6, DD-02).
- Tarifas por etapa/categoría (IN-02 queda diferida a Fase 2 según DD-04).
- Cambios a `configuracion-global-api`, `configuracion-en-lectura-op`, `modelo-datos-horas` ni `derivados-horas-reales`.
- Resolver IN-08 (enlace externo, ruta UNC y rango `O7:R8`): pertenece a C-13.

## Decisions

1. **Ubicación y nombres: tres slices de dominio, sin alias duplicados.** Las reglas de horas se amplían en `packages/domain/src/horas/`; los costos y el margen viven en `packages/domain/src/margen/`; el modelo de planilla en `packages/domain/src/exportacion/`. Se conservan los nombres canónicos ya especificados por C-08 —`calcularHorasVendidasTotales`, `calcularHorasRealesTotales`, `calcularDesvioHoras`, `calcularConsumoHoras`, `evaluarAlertaDesvio`— y se agregan `comparativaPorEtapa`, `costoMaterialReal`, `costoMaterialesCotizado`, `margenReal` y `construirModeloPlanilla`. Los nombres `horasVendidasTotales`, `horasRealesTotales` y `consumoPorcentaje` de CHANGES.md se tratan como etiquetas conceptuales de esas funciones existentes, no como nuevas firmas. Todo se reexporta desde `packages/domain/src/index.ts`. *Alternativa descartada:* crear alias con los nombres literales de CHANGES.md — dos nombres para una misma regla rompe RN-GLOBAL-02 y desincroniza los DTOs de C-08/C-09. *Alternativa descartada:* un único módulo `derivados/` — contradice la organización por vertical slice de `paquete-dominio-compartido`.

2. **Decimal explícito como cadena con operaciones centralizadas.** Se define `export type Decimal = string` en `packages/domain/src/decimal/` con operadores exactos sobre centésimas usando `bigint` (`sumar`, `restar`, `multiplicar`, `comparar`, `desdeCadena`). Horas e importes usan escala 2; cantidades de materiales hasta 4 (SU-02). `% Consumo` se reutiliza de `calcularConsumoHoras` (C-08), que devuelve el porcentaje con 2 decimales como cadena exacta vía `bigint`; la escala 4 queda reservada a cantidades de materiales (SU-02). No se aplica redondeo comercial a 2 decimales dentro del dominio: eso corresponde a C-12/C-14/15. Ninguna función usa `number`, `parseFloat`, `toNumber` ni `Math.round`. *Alternativa evaluada:* tipo distintivo marcado (`type Decimal = string & { readonly __decimal: unique symbol }`) — mayor seguridad nominal, pero obliga a convertir en cada frontera y a cambiar los contratos ya publicados por C-08/C-10; se documenta como evolución posible sin cambiar el formato en HTTP. *Alternativa descartada:* `number` — introduce coma flotante en importes (RN-MARGEN-05, R9).

3. **Umbral de desvío fijo de 15 puntos, sin columna nueva ni cambio de firma.** Se reutiliza `evaluarAlertaDesvio` tal cual; la constante `UMBRAL_DESVIO_PORCENTAJE = 15` se expone solo como documentación del dominio. La frontera se prueba con `avance` 80 y consumo `95.00` (sin alerta) / `95.01` (con alerta), como en `horas/reglas.test.ts:89-102`. La comparación es estricta (`consumo > avance + 15`) y se combina con `reales > vendidas` mediante OR (RN-HORAS-04). `avance` entra como entero 0..100 ya calculado por `calcularAvance`; el dominio no lo recalcula. *Alternativa descartada:* agregar `umbral_desvio` a `configuracion` — no existe columna ni respaldo en el esquema canónico y exigiría migración fuera de este change (la mención a HU-18 en RN-HORAS-04 no define ese parámetro).

4. **Horas sin etapa: bucket sintético explícito y al final.** `comparativaPorEtapa` agrupa los partes por `etapaId`; los que tienen `etapaId: null` (RN-HORAS-05) se consolidan en una fila `{ etapaId: null, nombreEtapa: 'Sin etapa' }` ubicada al final. Cada fila expone vendidas, reales, desvío en horas y `%` calculados con las funciones canónicas; con vendidas `0`, el `%` es `null` y no se lanza (RN-HORAS-06). *Alternativa descartada:* omitir esas horas — contradice el criterio de aceptación de HU-15. *Alternativa descartada:* imputarlas a la primera o última etapa — inventa un dato que la OP no tiene.

5. **`margenReal` con tasa inyectada y tasa cero sin excepción.** La firma recibe `valorHoraEstandar: Decimal` —proveniente de `ContextoTarjeta.valorHoraEstandar`, leído por C-10— junto con `montoVendido`, horas reales y agregados de materiales; no consulta DB ni guarda instantáneas (DD-04, R3). Con tasa `0`, el resultado es `montoVendido - costoMaterialesReal` y se expone `tasaGlobalNoConfigurada(tasa)` para que C-12 muestre la advertencia del Flujo 5. El resultado nunca es `null`. *Alternativa descartada:* devolver `null` o lanzar cuando la tasa es `0` — rompe el contrato del DTO y contradice el Flujo 5, que muestra el margen y solo advierte. *Diferido:* tarifa por etapa/categoría (IN-02).

6. **Modelo de planilla semántico, con unión discriminada por `incluirMargenes`.** `construirModeloPlanilla` devuelve `{ variante: 'costeo', ...campos, margen }` o `{ variante: 'operativa', ...campos }`, con claves semánticas (`cliente`, `numeroOp`, `materiales`, `horasVendidas`, `horasReales`, `valorHora`, `comparativa`) pobladas desde los derivados del dominio. No contiene `Buffer`, `fs`, `exceljs`, rutas ni literales de celdas: C-14/C-15 harán el MAP a celdas sobre las plantillas oficiales. *Alternativa descartada:* fijar rangos como `O7:R8` en el modelo — está bloqueada por C-13/IN-08. *Alternativa descartada:* construir el `.xlsx` en el dominio — viola R2 y R6.

7. **Cinco specs delta: tres nuevas y dos modificadas.** Nuevas: `comparativa-horas-por-etapa`, `costos-y-margen-real`, `modelo-planilla-compartido`. Modificadas por adición de requirements: `dto-derivados-orden` y `paquete-dominio-compartido`. No se tocan `derivados-horas-reales` (ya define totales, desvío, consumo y alerta), `configuracion-global-api`, `configuracion-en-lectura-op` (ya delega el margen a C-11), `modelo-datos-horas` ni `paquete-dominio-compartido` en su comportamiento existente. *Alternativa descartada:* un único capability `desvios-y-margen` — mezcla reglas de horas, costos y exportación en un spec gigante y sobre-promete lo que `derivados-horas-reales` ya cubre.

8. **Tests puros y exhaustivos por regla, sin base de datos.** La suite vive en `packages/domain/src/**/*.test.ts` con Vitest 5.1.1, entorno `node` y el runner propio del paquete. Cada RN se cubre con al menos dos casos (RED → GREEN → TRIANGULATE → REFACTOR): RN-HORAS-01..07 (incluida la regresión de C-08 a través de `comparativaPorEtapa` y el DTO), RN-MARGEN-01..06, división por cero (RN-HORAS-06), tasa `0` y tasa global inyectada/diferida (IN-02). No hay tests de integración ni contenedor PostgreSQL en este change. *Alternativa descartada:* tests HTTP con BD real — C-08/C-10 ya cubren esa capa y este change no modifica adaptadores (R10).

9. **DTOs canónicos, sin endpoints nuevos ni cálculo en React.** El constructor del dominio agrega los campos derivados al `DetalleOpDTO` y, donde corresponda, a `TarjetaOrdenDTO`; el espejo Zod del frontend se ajusta para transportarlos. La UI solo renderiza (C-12). *Alternativa descartada:* calcular en el handler o en el componente — duplica reglas y viola RN-GLOBAL-02/R2.

## Risks / Trade-offs

- **[Precisión de `% Consumo` con divisiones no terminadas] →** precisión de 2 decimales heredada de `calcularConsumoHoras` (C-08), sin modificar esa función; el formato comercial a 2 decimales queda en C-12/C-14/15, sin `number` en ningún punto (RN-MARGEN-05).
- **[Cambio de tasa revaloriza márgenes históricos] →** no hay snapshot ni backfill por R3; el Flujo 7 ya documenta el recálculo al leer cada OP (DD-04).
- **[`Decimal` como alias de `string` no distingue importes de horas en compile time] →** operaciones centralizadas en `packages/domain/src/decimal/` y tests de barrera; el tipo marcado queda como evolución compatible con el contrato HTTP.
- **[Umbral 15% no configurable] →** `evaluarAlertaDesvio` mantiene el 15 fijo y su firma sin cambios; `UMBRAL_DESVIO_PORCENTAJE = 15` solo documenta el dominio. La columna de configuración se evaluará en un change posterior con migración explícita.
- **[IN-08 sin cerrar] →** el modelo de planilla usa claves semánticas y no rangos de celda; C-14/C-15 no se bloquean por este change, pero su mapeo depende de C-13.
- **[C-12 consume campos que aún no renderiza] →** los DTOs crecen sin cambio de endpoints; el frontend debe espejar los tipos para no perderlos en el transporte.
- **[Desincronización con C-10 en ejecución paralela] →** C-11 no toca `configuracion` ni sus puertos; la única frontera es `ContextoTarjeta.valorHoraEstandar`, ya especificada.

## Migration Plan

Sin cambios de esquema ni de datos: no hay migraciones nuevas, columnas derivadas ni instantáneas de tasa. El despliegue publica el paquete `@velco/domain` y recompila backend y frontend para que los DTOs incluyan los campos nuevos; rollback = revertir el commit y reinstalar el bundle anterior, sin restauración de datos. Si un consumidor temprano esperara campos ausentes, los espejos Zod del frontend se publican en el mismo cambio para evitar desincronización.

## Open Questions

- ¿Se adopta desde el inicio el tipo marcado `Decimal` en lugar del alias de cadena? La propuesta elige el alias para no romper los contratos de C-08/C-10; pendiente de aprobación.
- ¿Debe el umbral de desvío pasar a `configuracion`? Requiere migración y acuerdo con Velco; se propone mantenerlo en 15 por ahora.
- ¿Etiqueta visible del bucket sin etapa: `Sin etapa` o `Sin etapa asignada`? Se propone `Sin etapa`; C-12 confirma el rótulo en UI.
- ¿El modelo de planilla incorpora rangos de celda conocidos o solo claves semánticas? Se propone solo semánticas hasta que C-13 cierre IN-08.
- IN-02 (tasa por etapa/categoría) sigue diferida a Fase 2; C-11 solo inyecta la tasa global vigente.
