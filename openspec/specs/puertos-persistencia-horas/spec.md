# puertos-persistencia-horas Specification

## Purpose
TBD - created by archiving change horas-reales-api. Update Purpose after archive.
## Requirements
### Requirement: Puerto `RegistroHoraRepository` en `application/ports`

El backend DEBE (SHALL) declarar la interfaz `RegistroHoraRepository` en `backend/src/features/horas/application/ports/` con operaciones tipadas para alta, listado por OP, búsqueda por id, actualización y baja de partes de horas. El puerto DEBE (SHALL) transportar `observacion` como campo opcional (`string | null`) en alta y actualización, y devolverlo en las lecturas, sin aplicar reglas de negocio (P-1). El puerto DEBE (SHALL) trabajar exclusivamente con tipos del dominio y NO DEBE (SHALL NOT) importar Fastify, Prisma, React ni `exceljs`, ni usar `any` (R2, R9).

#### Scenario: Ubicación del puerto

- **WHEN** se inspecciona `backend/src/features/horas/`
- **THEN** la interfaz está en `application/ports/` y no existe un directorio `infrastructure/` central

#### Scenario: Contrato mínimo

- **WHEN** se inspeccionan las firmas del puerto
- **THEN** exponen `crear`, `listarPorOrden`, `buscarPorId`, `actualizar` y `eliminar`, con `etapaId` nullable y sin parámetros `any`

#### Scenario: Observacion opcional transportada

- **WHEN** se inspeccionan las firmas de `crear` y `actualizar` y se lee un parte con `observacion`
- **THEN** aceptan y devuelven `observacion?: string | null` sin validar su contenido ni decidir códigos HTTP (P-1, R2)

#### Scenario: Operaciones dependientes de la OP

- **WHEN** se crea o se lista un parte
- **THEN** la operación recibe `ordenId` explícitamente y el puerto no expone escritura de totales ni de derivados (R3)

#### Scenario: Tipado estricto

- **WHEN** se ejecuta `npm run typecheck -w @velco/backend`
- **THEN** no hay errores ni apariciones de `any` en el puerto (R9)

### Requirement: Unidad de trabajo de horas inyectable

El backend DEBE (SHALL) declarar un puerto `UnidadTrabajoHoras` en `application/ports/` de la feature `horas`, con una firma tipada que entregue los repositorios enlazados a una transacción: `horas` (nuevo), `ops` y `etapas` (reutilizados de sus features). La unidad NO DEBE (SHALL NOT) extender ni modificar `UnidadTrabajoOps`, cuyo contrato pertenece a un capability archivado.

#### Scenario: Repositorios enlazados

- **WHEN** se inspecciona la firma del puerto
- **THEN** expone `horas`, `ops` y `etapas` tipados, sin parámetros `any` y sin exponer el cliente de Prisma a la aplicación

#### Scenario: Contrato archivado intacto

- **WHEN** se comparan los archivos de `puertos-persistencia-ordenes` con el código resultante
- **THEN** `UnidadTrabajoOps` conserva su forma original con `ops`, `etapas`, `clientes` y `materiales`, sin campo `horas`

#### Scenario: Atomicidad de la imputación

- **WHEN** un caso de uso crea un parte y la comprobación posterior falla dentro de `UnidadTrabajoHoras`
- **THEN** PostgreSQL revierte la escritura y la excepción llega al caso de uso sin que este conozca Prisma (R10)

#### Scenario: Eliminación de adaptadores

- **WHEN** se eliminan todos los adaptadores `backend/src/features/*/{prisma,http,excel}`
- **THEN** `packages/domain/` sigue compilando porque los puertos viven en el backend y el dominio no depende de ellos (R2)

### Requirement: Adaptador Prisma por feature sin lógica de negocio

Cada puerto DEBE (SHALL) tener su implementación concreta en `backend/src/features/horas/prisma/`, usando `PrismaClient` y `Prisma.TransactionClient` únicamente dentro del adaptador y convirtiendo los tipos de Prisma a los contratos del dominio. El adaptador NO DEBE (SHALL NOT) contener handlers Fastify, reglas `RN-*`, validación de `horas > 0` ni cálculo de derivados (R2, R3).

#### Scenario: Implementación local

- **WHEN** se busca la implementación de `RegistroHoraRepository` o `UnidadTrabajoHoras`
- **THEN** reside en `backend/src/features/horas/prisma/` y es inyectable sin que el caso de uso importe Prisma

#### Scenario: Sin reglas en el adaptador

- **WHEN** se inspecciona el adaptador
- **THEN** no calcula totales, desvíos, consumo ni alerta, y no decide códigos HTTP

#### Scenario: Sin mocks de base

- **WHEN** se ejecuta un test del adaptador
- **THEN** usa el contenedor `postgres:18.7` de la fundación y no sustituye `PrismaClient` por un doble (R10)

### Requirement: Decimales exactos en la frontera del puerto

Los valores de `horas` expuestos por el puerto DEBEN (SHALL) viajar como `string` decimal exacto con dos decimales (`"2.50"`); el adaptador DEBE convertir `Prisma.Decimal` a esa forma y viceversa, sin usar `number`, `parseFloat`, `toNumber` ni coma flotante (RN-MARGEN-05, R9).

#### Scenario: Lectura de horas

- **WHEN** un adaptador lee `horas` desde Prisma
- **THEN** el puerto devuelve una cadena como `"2.50"` sin pérdida de precisión

#### Scenario: Escritura de horas

- **WHEN** un adaptador recibe `"2.50"` para escribir
- **THEN** lo convierte a `Prisma.Decimal` y PostgreSQL almacena `NUMERIC(6,2)` con ese valor

#### Scenario: Rechazo de formatos inválidos

- **WHEN** el puerto recibe `"2,5"` o un número
- **THEN** el tipo estricto y la validación de frontera lo rechazan antes de llegar al adaptador (R9)
