# puertos-persistencia-ordenes Specification

## Purpose
TBD - created by archiving change core-order-models. Update Purpose after archive.
## Requirements
### Requirement: Puertos de repositorio en `application/ports`

El backend DEBE (SHALL) declarar las interfaces `ConfiguracionRepository`, `ClienteRepository`, `OpRepository` y `EtapaRepository` en `backend/src/features/<feature>/application/ports/`, respectivamente en las features `configuracion`, `clientes`, `ordenes` y `etapas`, con firmas TypeScript estrictas y sin `any`. `ConfiguracionRepository` DEBE ampliarse con `actualizar(configuracion: Configuracion): Promise<Configuracion>` para persistir el singleton conservando `obtener()`; `OpRepository` DEBE ampliarse con `listarConEtapas()` para obtener órdenes junto a sus etapas y el nombre del cliente en una sola consulta, y `EtapaRepository` DEBE ampliarse con `buscarPorId(id)` y `actualizarCompletada(id, completada)` para el marcado del checklist; las firmas existentes se conservan sin cambios (C-04, HU-18, RN-CONFIG-03).

#### Scenario: Ubicación de los puertos

- **WHEN** se inspecciona `backend/src/features/`
- **THEN** los cuatro puertos están en `application/ports/` de su feature y no existe un directorio `infrastructure/` central

#### Scenario: Contrato mínimo

- **WHEN** se inspeccionan las interfaces
- **THEN** exponen lectura y escritura del singleton de configuración, alta y búsqueda de cliente, alta y búsqueda de OP por id y `numero_op`, y alta en lote y lectura de etapas por OP

#### Scenario: Contrato ampliado para el tablero

- **WHEN** se inspeccionan `OpRepository` y `EtapaRepository`
- **THEN** `listarConEtapas` devuelve objetos `{ orden, etapas, clienteNombre }` tipados sin `any`, y `buscarPorId` y `actualizarCompletada` trabajan solo con `EtapaOrden` del dominio

#### Scenario: Escritura del singleton

- **WHEN** se llama `actualizar(configuracion)` con `id: 1`
- **THEN** el adaptador actualiza únicamente la fila existente `id = 1` y devuelve la configuración persistida, sin crear filas nuevas ni exponer baja

#### Scenario: Escritura limitada a completada

- **WHEN** se ejecuta `actualizarCompletada`
- **THEN** el puerto actualiza exclusivamente `etapas_orden.completada` y NO expone escritura de avance, semáforo, días restantes ni etapa `ahora` (R3)

#### Scenario: Tipado estricto

- **WHEN** se ejecuta `npm run typecheck -w @velco/backend`
- **THEN** no hay errores de tipos ni apariciones de `any` en los puertos (R9)

### Requirement: Adaptadores Prisma por feature

Cada puerto DEBE (SHALL) tener una implementación concreta en `backend/src/features/<feature>/prisma/` que utilice `PrismaClient` y convierta los tipos de Prisma a los contratos del dominio; NO DEBE (SHALL NOT) existir una capa de infraestructura compartida.

#### Scenario: Implementación local a la feature

- **WHEN** se busca la implementación de un puerto
- **THEN** reside en la carpeta `prisma/` de la misma feature y es inyectable en los casos de uso sin que estos importen Prisma

#### Scenario: Sin acoplamiento HTTP

- **WHEN** se inspeccionan los adaptadores
- **THEN** no contienen handlers Fastify ni reglas de negocio, y no se crean adaptadores `http` o `excel` vacíos

### Requirement: Dominio sin dependencias de framework

`packages/domain/src/` NO DEBE (SHALL NOT) importar Fastify, Prisma, React ni `exceljs`, y DEBE (SHALL) seguir compilando aunque se eliminen todos los adaptadores `backend/src/features/*/{prisma,http,excel}`.

#### Scenario: Búsqueda de importaciones prohibidas

- **WHEN** se buscan importaciones de frameworks dentro de `packages/domain/src/`
- **THEN** no se encuentra ninguna (R2)

#### Scenario: Eliminación de adaptadores

- **WHEN** se eliminan todos los adaptadores por feature
- **THEN** `npm run typecheck -w @velco/domain` finaliza sin errores

### Requirement: Decimales exactos en la frontera del puerto

Los valores monetarios y de horas expuestos por los puertos DEBEN (SHALL) viajar como `string` decimal exacto; los adaptadores DEBEN (SHALL) convertir `Prisma.Decimal` a ese formato y viceversa, sin usar `number`, `parseFloat` ni `toNumber()`.

#### Scenario: Lectura de un importe

- **WHEN** un adaptador lee `monto_vendido` desde Prisma
- **THEN** el puerto devuelve una cadena como `"1250.50"` sin pérdida de precisión

#### Scenario: Escritura de un importe

- **WHEN** un adaptador recibe un importe como cadena para escribirlo
- **THEN** lo convierte a `Prisma.Decimal` y la base almacena el valor en `NUMERIC(14,2)`

### Requirement: Puertos de escritura y búsqueda de plano

`OpRepository` DEBE (SHALL) ampliarse con `buscarPorCodigoPlano(codigo: string, opIdExcluida?: string): Promise<OrdenTrabajo | null>` para detección de duplicados y exclusión de la propia OP en edición. Los puertos de `clientes`, `etapas` y `materiales` DEBEN (SHALL) exponer las operaciones de alta, lectura por OP, reorden y baja necesarias para los casos de uso de C-06, con firmas estrictas y sin `any` (DD-11, R2, R9).

#### Scenario: Búsqueda por plano normalizado

- **WHEN** se llama `buscarPorCodigoPlano('PL-2026-045')`
- **THEN** se devuelve la OP que tiene ese valor exacto, o `null` si no existe

#### Scenario: Exclusión de la OP editada

- **WHEN** se llama `buscarPorCodigoPlano('PL-2026-045', idDeLaMismaOP)`
- **THEN** no se devuelve esa OP, permitiendo conservar el plano al editar

#### Scenario: Sin `any` en puertos

- **WHEN** se ejecuta el typecheck del backend
- **THEN** los puertos ampliados compilan sin errores y sin `any` (R9)

### Requirement: Unidad de trabajo transaccional inyectable

El backend DEBE (SHALL) declarar un puerto `UnidadTrabajoOps` en `application/ports/` de la feature `ordenes`, con una firma tipada que entregue los repositorios enlazados a una transacción. Su implementación en `ordenes/prisma/` DEBE (SHALL) usar `PrismaClient.$transaction` y `Prisma.TransactionClient` únicamente dentro del adaptador; los casos de uso NO DEBEN (SHALL NOT) importar Prisma ni Fastify (R2, R10).

#### Scenario: Atomicidad de la alta

- **WHEN** un caso de uso ejecuta cliente + OP + etapas + materiales mediante `UnidadTrabajoOps` y falla el último paso
- **THEN** PostgreSQL revierte todas las escrituras y la excepción llega al caso de uso sin que este conozca Prisma

#### Scenario: Repositorios enlazados

- **WHEN** se inspecciona la firma del puerto
- **THEN** expone operaciones de OP, cliente, etapa y material tipadas, sin parámetros `any` y sin exponer el cliente de Prisma a la aplicación

#### Scenario: Eliminación de adaptadores

- **WHEN** se eliminan todos los adaptadores `backend/src/features/*/{prisma,http,excel}`
- **THEN** `packages/domain/` sigue compilando porque la unidad de trabajo y los puertos viven en el backend y el dominio no depende de ellos (R2)

### Requirement: Fallo de P2002 traducido en el adaptador

El adaptador Prisma DEBE (SHALL) capturar `PrismaClientKnownRequestError` con `code === 'P2002'` y traducirlo al error de dominio correspondiente (`codigo_plano_duplicado` o `numero_op_duplicado`), resolviendo la OP existente con el puerto de búsqueda cuando haga falta. La lógica NO DEBE (SHALL NOT) resolverse con un mock de Prisma en tests de integración (DD-11, RN-OP-06, R10).

#### Scenario: Conflicto de plano por carrera

- **WHEN** un INSERT simultáneo provoca `P2002` sobre el índice de `codigo_plano`
- **THEN** el adaptador entrega un `CodigoPlanoDuplicadoError` con `opExistente` resuelto desde PostgreSQL real

#### Scenario: Conflicto de número de OP

- **WHEN** un INSERT simultáneo provoca `P2002` sobre `numero_op`
- **THEN** el adaptador entrega un error `numero_op_duplicado` con `numeroOp` y sin `opExistente`, sin confundirlo con el de plano (DU-4)

#### Scenario: Sin mocks de base

- **WHEN** se ejecuta el test de carrera
- **THEN** usa el contenedor `postgres:18.7` compartido por la fundación y no sustituye `PrismaClient` por un doble (R10)
