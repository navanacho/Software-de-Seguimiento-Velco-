# derivados-horas-reales Specification

## Purpose
TBD - created by archiving change horas-reales-api. Update Purpose after archive.
## Requirements
### Requirement: Contrato puro del parte de horas y validación positiva

`packages/domain/src/horas/` DEBE (SHALL) definir el contrato inmutable del parte (`id`, `ordenId`, `etapaId: string | null`, `operario`, `fecha`, `horas` como cadena decimal, `createdAt` y `observacion?: string | null`) y una función pura de validación que rechace `horas <= 0`, `operario` vacío y fecha inválida, sin importar Fastify, Prisma, React, `exceljs` ni `zod` (RN-HORAS-05, R2, R9).

#### Scenario: Parte válido con etapa

- **WHEN** se valida un parte con `horas: '2.50'`, operario no vacío, fecha válida y `etapaId` de la OP
- **THEN** la validación pasa y el parte conserva todos sus campos sin normalizaciones ocultas

#### Scenario: Parte válido sin etapa

- **WHEN** se valida un parte con `etapaId: null`
- **THEN** la validación pasa y el parte queda apto para imputarse a la OP sin vincularlo a ninguna etapa (HU-10, RN-HORAS-05)

#### Scenario: Observacion opcional en el contrato

- **WHEN** se valida un parte con `observacion: 'Revisar tornillería'` y otro sin el campo
- **THEN** ambos pasan la validación y la observacion se conserva como texto o `null`, sin convertirse en regla de negocio (P-1)

#### Scenario: Horas no positivas

- **WHEN** se valida un parte con `horas: '0'`, `'0.00'` o `'-1.00'`
- **THEN** la regla de dominio lo rechaza con un error tipado, independientemente de la validación HTTP o del `CHECK` de PostgreSQL (RN-HORAS-05)

#### Scenario: Operario y fecha inválidos

- **WHEN** se valida un parte con operario vacío o fecha fuera del calendario
- **THEN** la regla de dominio lo rechaza sin lanzar excepciones de UI ni consultar una base de datos (R10)

### Requirement: Totales y desvío calculados en dominio

El dominio DEBE (SHALL) exponer funciones puras que calculen `horasRealesTotales` como suma exacta de `horas` de los partes y `desvioHoras` como `horasVendidasTotales - horasRealesTotales`. El total de vendidas DEBE reutilizar `calcularHorasVendidasTotales` y la aritmética DEBE usar centésimas con `bigint` o equivalente exacto, nunca coma flotante (RN-HORAS-01, RN-HORAS-02, RN-GLOBAL-02, RN-MARGEN-05).

#### Scenario: Suma de partes

- **WHEN** se calculan los reales de partes con `2.50`, `1.25` y `0.75` horas
- **THEN** el resultado es la cadena exacta `"4.50"`, sin redondeos intermedios

#### Scenario: Desvío positivo y negativo

- **WHEN** las vendidas son `"4.00"` y los reales `"3.00"`
- **THEN** el desvío es `"1.00"` (ahorro); cuando los reales son `"5.00"`, el desvío es `"-1.00"` (pérdida)

#### Scenario: Lista vacía

- **WHEN** una OP no tiene partes imputados
- **THEN** `horasRealesTotales` es `"0.00"` y el desvío equivale a las horas vendidas totales, sin errores ni valores `null`

#### Scenario: Sin columnas calculadas

- **WHEN** se inspecciona el resultado de las funciones
- **THEN** ningún valor se escribe en PostgreSQL ni se agrega como columna al esquema (R3)

### Requirement: Consumo, división por cero y alerta de desvío

El dominio DEBE (SHALL) calcular `% Consumo = (horas reales / horas vendidas) * 100` y DEBE devolver `null` cuando `horas vendidas = 0`, sin lanzar. La alerta DEBE activarse si `% Consumo > % Avance + 15` o si `horas reales > horas vendidas`, incluso cuando el porcentaje de consumo no exista (RN-HORAS-03, RN-HORAS-04, RN-HORAS-06).

#### Scenario: Consumo con vendidas positivas

- **WHEN** las reales son `"3.75"` y las vendidas `"4.00"`
- **THEN** el consumo es `"93.75"` como cadena decimal exacta

#### Scenario: Vendidas cero

- **WHEN** las vendidas son `"0.00"` y las reales `"1.00"`
- **THEN** el consumo es `null` y la alerta se activa únicamente por `reales > vendidas` (RN-HORAS-06)

#### Scenario: Alerta por avance superado

- **WHEN** el consumo es `95` y el avance es `80`
- **THEN** la alerta se activa porque `95 > 80 + 15`

#### Scenario: Sin alerta

- **WHEN** el consumo es `93.75`, el avance es `80` y las reales no superan a las vendidas
- **THEN** la alerta no se activa

#### Scenario: Alerta por exceso de horas

- **WHEN** las reales superan a las vendidas aunque la fecha esté lejos
- **THEN** la alerta se activa sin consultar configuración de plazos ni fechas (RN-HORAS-04)

### Requirement: Una sola implementación, recálculo tras cada mutación

Las funciones de esta capability DEBEN (SHALL) ser la única implementación de totales, desvío, consumo y alerta de horas reales, y DEBEN invocarse al construir el detalle y después de alta, edición o baja de partes. Ni los handlers HTTP, ni los adaptadores Prisma, ni el frontend DEBEN (SHALL NOT) reimplementarlas ni comparar horas por su cuenta (RN-GLOBAL-02, R2, R3).

#### Scenario: Recálculo tras alta

- **WHEN** se imputa un nuevo parte
- **THEN** los derivados del detalle se reconstruyen desde la colección fresca de partes con estas funciones, sin incrementos ni cachés

#### Scenario: Recálculo tras edición

- **WHEN** se corrige el valor de `horas` de un parte
- **THEN** el total refleja el nuevo valor y no conserva el anterior

#### Scenario: Recálculo tras baja

- **WHEN** se elimina un parte
- **THEN** el total y el desvío se recalculan sin leer ningún agregado almacenado

#### Scenario: Consumo por API y frontend

- **WHEN** backend y frontend necesitan estos derivados
- **THEN** ambos consumen los valores producidos por el dominio a través del DTO, sin definir una segunda fórmula (RN-GLOBAL-02)
