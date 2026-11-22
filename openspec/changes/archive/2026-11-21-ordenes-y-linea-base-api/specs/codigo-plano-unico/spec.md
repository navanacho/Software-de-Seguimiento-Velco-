## ADDED Requirements

### Requirement: Tipo `CodigoPlano` y normalización en la frontera HTTP

El dominio DEBE (SHALL) exponer el tipo `CodigoPlano` como `string | null` y una función pura de normalización que aplique `trim()` y `toUpperCase()` y convierta una cadena vacía en `null`. La normalización DEBE (SHALL) ejecutarse en la capa HTTP antes de construir cualquier comando de aplicación; ni el caso de uso ni el adaptador Prisma DEBEN recibir un plano sin normalizar. `packages/domain/src/` NO DEBE (SHALL NOT) importar Fastify, Prisma, React ni `exceljs` (DD-11, RN-OP-05/06, R2, R9).

#### Scenario: Normalización de espacios y mayúsculas

- **WHEN** la request envía `"  pl-2026-045  "` como código de plano
- **THEN** el comando de aplicación recibe `"PL-2026-045"` y la OP se persiste con ese valor normalizado

#### Scenario: Cadena vacía equivale a sin plano

- **WHEN** la request envía `""` o `"   "` como código de plano
- **THEN** el valor normalizado es `null`, la columna se almacena como `NULL` y la tarjeta lo transporta como `codigoPlano: null`

#### Scenario: Plano ausente

- **WHEN** la request omite el campo de plano
- **THEN** la OP se crea sin plano y no se ejecuta ninguna comparación de unicidad sobre `codigo_plano`

#### Scenario: Dominio sin frameworks

- **WHEN** se buscan importaciones de frameworks en `packages/domain/src/ordenes/` y en el nuevo módulo de plano
- **THEN** no se encuentra ninguna y el typecheck del paquete pasa sin `any` (R2, R9)

### Requirement: Unicidad condicional y prohibición de cadena vacía en PostgreSQL

La migración 002 DEBE (SHALL) agregar `codigo_plano VARCHAR(80) NULL` a `ordenes_trabajo`, un `CHECK (codigo_plano <> '')` y un índice único parcial `WHERE codigo_plano IS NOT NULL`. NO DEBE (SHALL NOT) declararse `@unique` sobre el campo en `schema.prisma`, renumerarse la migración 001 ni escribirse un agregado derivado (DD-11, RN-OP-05, R3).

#### Scenario: Migración aditiva

- **WHEN** se aplican las migraciones 001 y 002 sobre PostgreSQL 18.7 real
- **THEN** la migración 001 permanece sin cambios y la 002 agrega la columna, el CHECK, el índice parcial y la tabla de materiales

#### Scenario: Plano duplicado rechazado por la base

- **WHEN** dos OPs reciben el mismo `codigo_plano` no nulo
- **THEN** PostgreSQL rechaza la segunda escritura por el índice parcial y la primera OP permanece intacta

#### Scenario: Muchas OPs sin plano

- **WHEN** se insertan tres OPs con `codigo_plano = NULL`
- **THEN** las tres escrituras se aceptan porque el índice parcial no cubre `NULL`

#### Scenario: Cadena vacía rechazada

- **WHEN** se intenta escribir `codigo_plano = ''` directamente en la base
- **THEN** PostgreSQL rechaza la escritura por el CHECK, aunque la normalización HTTP ya convierta el vacío en `NULL`

### Requirement: Conflicto de plano con respuesta 409 y fallback por carrera

El backend DEBE (SHALL) responder HTTP 409 con `{ error: 'codigo_plano_duplicado', message: 'El ID de plano PL-2026-045 ya está asignado a la OP 1871.', codigoPlano: 'PL-2026-045', opExistente: { id: '<uuid>', numeroOp: '1871' } }` cuando el plano normalizado ya pertenece a otra OP. El mensaje DEBE (SHALL) interpolar el código y el `numeroOp` reales de la OP existente. Si la verificación previa no detecta el conflicto pero PostgreSQL devuelve `PrismaClientKnownRequestError` con code `P2002`, el adaptador DEBE (SHALL) traducirlo al mismo error de dominio resolviendo la OP existente con `OpRepository.buscarPorCodigoPlano` (DD-11, RN-OP-06).

#### Scenario: Conflicto detectado antes de escribir

- **WHEN** se envía `POST /api/ops` con un plano ya asignado a la OP 1871
- **THEN** la respuesta es 409 con `error: 'codigo_plano_duplicado'`, `codigoPlano` normalizado y `opExistente` con el `id` y `numeroOp: '1871'` de la OP existente

#### Scenario: Cuerpo del conflicto de número de OP distinto del de plano

- **WHEN** un 409 se origina en un `numero_op` ya asignado a otra OP
- **THEN** el cuerpo es `{ error: 'numero_op_duplicado', message, numeroOp }`, sin `opExistente`, análogo al de plano pero sin el objeto de la OP existente (DU-4)

#### Scenario: Edición de la misma OP

- **WHEN** se envía `PUT /api/ops/:id` conservando el plano que esa misma OP ya tiene
- **THEN** la operación se acepta y NO se devuelve 409, porque la búsqueda excluye la OP editada

#### Scenario: Carrera entre verificación e inserción

- **WHEN** otra transacción inserta el plano entre la verificación y el INSERT, provocando `P2002`
- **THEN** el adaptador traduce el error al mismo contrato 409 y resuelve `opExistente` consultando la BD real (sin mock de PostgreSQL, R10)

#### Scenario: Error centralizado

- **WHEN** se inspecciona `backend/src/shared/errores.ts` y el error handler de `app.ts`
- **THEN** existe la clase de error dedicada y una rama tipada que produce el cuerpo 409 exacto, sin `any` (R9)
