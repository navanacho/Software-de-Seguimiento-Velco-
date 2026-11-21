# cliente-y-contenedores-tablero Specification

## Purpose
TBD - created by archiving change tablero-visual. Update Purpose after archive.
## Requirements
### Requirement: Adaptador HTTP delgado sin lógica de negocio

`frontend/src/shared/domain-client/` DEBE (SHALL) importar `TarjetaOrdenDTO`, `EtapaTarjeta`, `GrupoFlujo` y `EstadoSemaforo` desde `@velco/domain`, validar con zod el envelope de `GET /api/ops` y la tarjeta devuelta por `PATCH`, y declarar únicamente los tipos de transporte que el dominio no exporta. NO DEBE (SHALL NOT) redefinir el DTO ni contener reglas de negocio (RN-GLOBAL-02, R2, R9).

#### Scenario: Tipos canónicos importados

- **WHEN** se inspeccionan los tipos usados por el cliente HTTP
- **THEN** `TarjetaOrdenDTO`, `EtapaTarjeta`, `GrupoFlujo` y `EstadoSemaforo` provienen de `@velco/domain` y no existen declaraciones duplicadas en el frontend

#### Scenario: Envelope validado en la frontera

- **WHEN** el cuerpo de `GET /api/ops` no respeta `{ ops, kpis, flujo }`
- **THEN** zod rechaza la respuesta antes de pasarla a la UI y no se renderizan tarjetas con datos parciales

#### Scenario: Sin cálculos en el cliente

- **WHEN** se inspecciona `shared/domain-client/`
- **THEN** no hay cálculo de avance, semáforo, plazos ni agrupamiento de flujo, y la construcción de la query usa los parámetros definidos por C-04

### Requirement: Separación contenedor/presentacional

Los contenedores DEBEN (SHALL) cargar los DTOs con TanStack Query y pasarlos por props a los componentes presentacionales. Los componentes de tarjeta NO DEBEN (SHALL NOT) ejecutar peticiones ni mutar directamente el server state (§Container/Presentational de la KB).

#### Scenario: Contenedor carga el envelope

- **WHEN** se monta el tablero
- **THEN** el contenedor obtiene `ops`, `kpis` y `flujo` mediante el hook de consulta y los entrega a los componentes de KPIs, tira y grilla

#### Scenario: Tarjeta presentacional

- **WHEN** se renderiza una tarjeta con un `TarjetaOrdenDTO` de ejemplo
- **THEN** el componente produce markup a partir de sus props y no llama a `fetch`, `useQuery` ni `useMutation`

#### Scenario: Mutación en un hook

- **WHEN** se usa el checkbox de una etapa
- **THEN** la mutación se ejecuta en un hook bajo `frontend/src/features/tablero/hooks/` y la tarjeta recibe el manejador como prop
