## ADDED Requirements

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
