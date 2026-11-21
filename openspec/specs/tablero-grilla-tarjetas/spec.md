# tablero-grilla-tarjetas Specification

## Purpose
TBD - created by archiving change tablero-visual. Update Purpose after archive.
## Requirements
### Requirement: Grilla única de tarjetas autocontenidas

La SPA DEBE (SHALL) renderizar el arreglo `ops` de `GET /api/ops` como una grilla única con una tarjeta por `TarjetaOrdenDTO`. NO DEBE (SHALL NOT) agrupar las tarjetas en columnas por etapa ni ofrecer un control manual del porcentaje de avance (HU-05, HU-07, RN-GLOBAL-01, R3).

#### Scenario: Una tarjeta por OP en un único contenedor

- **WHEN** el tablero recibe un envelope con tres elementos en `ops`
- **THEN** se renderizan tres tarjetas dentro de un único contenedor de grilla y no se crea ningún contenedor de columna por etapa

#### Scenario: Tarjeta autocontenida

- **WHEN** se inspecciona una tarjeta del tablero
- **THEN** muestra `numeroOp`, `clienteNombre`, `descripcionPieza`, su lista de `etapas` y los derivados del DTO sin depender del estado de otras tarjetas

#### Scenario: Ausencia de slider de avance

- **WHEN** se inspecciona una tarjeta con `avance` parcial
- **THEN** el avance se muestra como texto o barra de solo lectura y NO existe un `input` de tipo `range` ni otro control editable que permita cambiar el porcentaje

### Requirement: Derivados renderizados tal como vienen del dominio

El frontend DEBE (SHALL) mostrar `semaforo`, `avance`, `diasRestantes` y `etiquetaPlazo` exactamente como llegan en `TarjetaOrdenDTO`. NO DEBE (SHALL NOT) invocar `calcularSemaforo`, `diasRestantes`, `etapaAhora` ni `construirTarjetaOrden`, ni comparar fechas para obtener el estado (RN-GLOBAL-02, RN-GLOBAL-04, RN-SEMAFORO-01..06).

#### Scenario: Semáforo en los cuatro estados

- **WHEN** el tablero recibe tarjetas con `semaforo` `Terminado`, `Atrasado`, `En riesgo` y `En plazo`
- **THEN** cada tarjeta aplica la clase visual correspondiente —gris, rojo, amarillo y verde respectivamente— sin evaluar fechas ni avances en el componente

#### Scenario: Etiqueta de plazo literal

- **WHEN** una tarjeta trae `etiquetaPlazo` `"Faltan 2 días"` y `diasRestantes` `2`
- **THEN** la tarjeta muestra ese texto y ese número sin reformularlos ni recalcularlos

#### Scenario: Sin lógica de cálculo en el feature

- **WHEN** se inspeccionan los archivos de `frontend/src/features/tablero/` y `frontend/src/shared/domain-client/`
- **THEN** no aparecen imports de funciones de cálculo del dominio ni comparaciones entre fechas, y los derivados se leen sólo como propiedades del DTO

### Requirement: KPIs superiores y estética industrial

El tablero DEBE (SHALL) mostrar los KPIs superiores a partir de `kpis.total` y de los cuatro valores de `kpis.porEstado`, con franja amarilla/negra y tipografía condensada definidas en CSS Modules y `global.css`, sin incorporar dependencias nuevas (HU-05, DD-01).

#### Scenario: Conteo por estado del semáforo

- **WHEN** `kpis.total` es `4` y `kpis.porEstado` contiene dos `En plazo`, un `Atrasado`, un `Terminado` y cero `En riesgo`
- **THEN** el encabezado muestra el total y los cuatro conteos con esos valores

#### Scenario: Tablero sin OPs

- **WHEN** `kpis.total` es `0` y `ops` está vacío
- **THEN** los KPIs se muestran en cero y la grilla no renderiza tarjetas

#### Scenario: Identidad visual del prototipo

- **WHEN** se renderiza el encabezado del tablero
- **THEN** está presente la franja amarilla/negra, la grilla aplica la pila de fuentes condensadas y no se han agregado librerías de estilos ni fuentes externas
