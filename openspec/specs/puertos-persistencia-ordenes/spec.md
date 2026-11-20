# puertos-persistencia-ordenes Specification

## Purpose
TBD - created by archiving change core-order-models. Update Purpose after archive.
## Requirements
### Requirement: Puertos de repositorio en `application/ports`

El backend DEBE (SHALL) declarar las interfaces `ConfiguracionRepository`, `ClienteRepository`, `OpRepository` y `EtapaRepository` en `backend/src/features/<feature>/application/ports/`, respectivamente en las features `configuracion`, `clientes`, `ordenes` y `etapas`, con firmas TypeScript estrictas y sin `any`.

#### Scenario: Ubicación de los puertos

- **WHEN** se inspecciona `backend/src/features/`
- **THEN** los cuatro puertos están en `application/ports/` de su feature y no existe un directorio `infrastructure/` central

#### Scenario: Contrato mínimo

- **WHEN** se inspeccionan las interfaces
- **THEN** exponen lectura del singleton de configuración, alta y búsqueda de cliente, alta y búsqueda de OP por id y `numero_op`, y alta en lote y lectura de etapas por OP

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

