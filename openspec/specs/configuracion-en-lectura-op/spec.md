# configuracion-en-lectura-op Specification

## Purpose
TBD - created by archiving change configuracion-global. Update Purpose after archive.
## Requirements
### Requirement: Configuración vigente en cada lectura de OP

El backend DEBE (SHALL) construir el `ContextoTarjeta` de `GET /api/ops`, `GET /api/ops/:id` y de la respuesta del `PATCH /api/ops/:id/etapas/:etapaId` leyendo la fila singleton en ese momento, sin caché ni valores incrustados en el código. Los umbrales DEBEN (SHALL) inyectarse en el cálculo del semáforo mediante las funciones puras del dominio, y la tasa vigente DEBE (SHALL) quedar disponible en `ContextoTarjeta.valorHoraEstandar` para el cálculo del margen que se implementará en C-11. C-10 NO DEBE (SHALL NOT) calcular ni devolver `margen` en los DTO: esa regla y su campo se incorporan en C-11 (Flujo 7, RN-SEMAFORO-03, DD-04, R2/R3; RN-MARGEN-01/04 se implementan en C-11).

#### Scenario: Umbral cambiado antes de listar

- **WHEN** se guarda `diasAlertaRiesgo: 5` y luego se llama `GET /api/ops` para una OP que vence en 4 días con avance menor al umbral
- **THEN** esa OP se devuelve con `semaforo: "En riesgo"`, calculado con el umbral vigente

#### Scenario: Tasa vigente disponible antes de detallar

- **WHEN** se guarda `valorHoraEstandar: "2000.00"` y luego se llama `GET /api/ops/:id` para una OP con horas reales imputadas
- **THEN** el `ContextoTarjeta` usado para construir el detalle expone `valorHoraEstandar: "2000.00"` y el DTO resultante no incluye `margen`; el cálculo del margen con esa tasa queda diferido a C-11

#### Scenario: Recálculo tras marcar etapa

- **WHEN** se persiste `completada` mediante `PATCH /api/ops/:id/etapas/:etapaId`
- **THEN** la respuesta reconstruye avance y semáforo con la configuración vigente y la nueva etapa completada, sin incluir `margen`

### Requirement: Derivados recalculados sin persistencia ni lógica en React

Los cambios de umbrales o de tasa NO DEBEN (SHALL NOT) escribirse en columnas de OP ni generar migraciones; el frontend DEBE (SHALL) mostrar los derivados tal como llegan en el DTO, sin comparar fechas ni calcular márgenes por su cuenta. Tras guardar la configuración, el cliente DEBE (SHALL) invalidar las consultas de tablero y detalle para repintar con la configuración vigente (R3, RN-GLOBAL-02, Flujo 7).

#### Scenario: Sin columnas derivadas

- **WHEN** se inspecciona `schema.prisma` y las migraciones después de cambiar umbrales y tasa
- **THEN** no aparecen columnas para semáforo, margen, totales ni instantáneas de tasa

#### Scenario: Repintado tras guardar

- **WHEN** se guarda la configuración desde `/configuracion` y se vuelve al tablero
- **THEN** las tarjetas muestran el semáforo calculado con los nuevos umbrales, sin cálculo local en React

#### Scenario: Sin duplicación de reglas

- **WHEN** se buscan las fórmulas de semáforo y margen en backend y frontend
- **THEN** la de semáforo tiene su única implementación en `packages/domain/` y ambos consumen el DTO resultante; no aparece `calcularMargen` hasta C-11
