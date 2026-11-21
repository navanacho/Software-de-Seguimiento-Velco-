## MODIFIED Requirements

### Requirement: Puertos de repositorio en `application/ports`

El backend DEBE (SHALL) declarar las interfaces `ConfiguracionRepository`, `ClienteRepository`, `OpRepository` y `EtapaRepository` en `backend/src/features/<feature>/application/ports/`, respectivamente en las features `configuracion`, `clientes`, `ordenes` y `etapas`, con firmas TypeScript estrictas y sin `any`. `OpRepository` DEBE ampliarse con `listarConEtapas()` para obtener órdenes junto a sus etapas y el nombre del cliente en una sola consulta, y `EtapaRepository` DEBE ampliarse con `buscarPorId(id)` y `actualizarCompletada(id, completada)` para el marcado del checklist; las firmas existentes se conservan sin cambios (C-04).

#### Scenario: Ubicación de los puertos

- **WHEN** se inspecciona `backend/src/features/`
- **THEN** los cuatro puertos están en `application/ports/` de su feature y no existe un directorio `infrastructure/` central

#### Scenario: Contrato mínimo

- **WHEN** se inspeccionan las interfaces
- **THEN** exponen lectura del singleton de configuración, alta y búsqueda de cliente, alta y búsqueda de OP por id y `numero_op`, y alta en lote y lectura de etapas por OP

#### Scenario: Contrato ampliado para el tablero

- **WHEN** se inspeccionan `OpRepository` y `EtapaRepository`
- **THEN** `listarConEtapas` devuelve objetos `{ orden, etapas, clienteNombre }` tipados sin `any`, y `buscarPorId` y `actualizarCompletada` trabajan solo con `EtapaOrden` del dominio

#### Scenario: Escritura limitada a completada

- **WHEN** se ejecuta `actualizarCompletada`
- **THEN** el puerto actualiza exclusivamente `etapas_orden.completada` y NO expone escritura de avance, semáforo, días restantes ni etapa `ahora` (R3)

#### Scenario: Tipado estricto

- **WHEN** se ejecuta `npm run typecheck -w @velco/backend`
- **THEN** no hay errores de tipos ni apariciones de `any` en los puertos (R9)
