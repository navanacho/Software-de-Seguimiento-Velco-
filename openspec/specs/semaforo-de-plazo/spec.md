# semaforo-de-plazo Specification

## Purpose
TBD - created by archiving change estado-y-avance-domain. Update Purpose after archive.
## Requirements
### Requirement: Prioridad estricta del semáforo de plazo

El dominio DEBE (SHALL) calcular el estado de plazo evaluando, en orden y con retorno anticipado: `Terminado`, `Atrasado`, `En riesgo`, `En plazo`. `Terminado` se da cuando el avance es `100` o todas las etapas están completadas; `Atrasado` cuando `hoy > fecha_entrega` y la OP no está terminada; `En riesgo` cuando `(fecha_entrega - hoy) <= dias_alerta_riesgo` y `avance < porcentaje_avance_riesgo`; `En plazo` en cualquier otro caso activo. El estado terminado DEBE prevalecer aunque la fecha esté vencida (RN-SEMAFORO-01..05, HU-05).

#### Scenario: Terminada con fecha vencida

- **WHEN** una OP tiene todas las etapas completadas y su fecha de entrega ya pasó
- **THEN** `calcularSemaforo` devuelve `Terminado` (gris), no `Atrasado`

#### Scenario: Terminada por avance cien con etapas pendientes

- **WHEN** el avance recibido es `100` aunque quede una etapa sin completar
- **THEN** `calcularSemaforo` devuelve `Terminado`

#### Scenario: Atrasada

- **WHEN** una OP activa tiene `hoy` posterior a `fecha_entrega`
- **THEN** `calcularSemaforo` devuelve `Atrasado` (rojo), aunque su avance sea bajo

#### Scenario: En riesgo

- **WHEN** una OP activa vence dentro de los `dias_alerta_riesgo` y su avance es menor a `porcentaje_avance_riesgo`
- **THEN** `calcularSemaforo` devuelve `En riesgo` (amarillo)

#### Scenario: En plazo

- **WHEN** una OP activa vence después del umbral de alerta o su avance alcanza el umbral de riesgo
- **THEN** `calcularSemaforo` devuelve `En plazo` (verde)

### Requirement: Umbrales inyectados desde configuración

El dominio DEBE (SHALL) recibir `diasAlertaRiesgo` y `porcentajeAvanceRiesgo` como parámetros del contexto de cálculo y NO DEBE importar Prisma, consultar la fila singleton de `configuracion` ni leer variables de entorno. Cambiar los umbrales DEBE cambiar el resultado del semáforo sin modificar código (RN-SEMAFORO-03, RN-CONFIG-02, R2, R9).

#### Scenario: Ampliar días de alerta

- **WHEN** una OP vence en 4 días con umbral de 3 días y se recalcula con umbral de 5 días
- **THEN** el estado pasa de `En plazo` a `En riesgo` si el avance no cambia

#### Scenario: Elevar porcentaje de riesgo

- **WHEN** una OP con avance `70` vence en 2 días y el umbral de avance pasa de `80` a `60`
- **THEN** el estado pasa de `En riesgo` a `En plazo`

#### Scenario: Sin infraestructura

- **WHEN** se inspeccionan las importaciones del módulo de semáforo
- **THEN** no aparece `@prisma/client`, Fastify, React ni `exceljs`

### Requirement: Comparación calendaria a medianoche de TZ

El dominio DEBE (SHALL) convertir `hoy` a una fecha calendaria `YYYY-MM-DD` en la zona horaria recibida como parámetro antes de compararla con `fecha_entrega`, usando `Intl.DateTimeFormat` con `formatToParts` y sin depender del `TZ` del proceso ni del locale. La conversión DEBE hacerse a medianoche local: NO DEBEN usarse marcas de tiempo UTC ni divisiones por 86 400 000 ms (RN-SEMAFORO-06, SU-05).

#### Scenario: Misma instante, dos zonas

- **WHEN** se calcula el semáforo para el mismo instante con dos zonas horarias distintas que caen en días calendarios diferentes
- **THEN** los días restantes y el estado pueden diferir, y el resultado depende solo del parámetro `zonaHoraria`

#### Scenario: Vence hoy

- **WHEN** `hoy` en la zona indicada equivale a `fecha_entrega`
- **THEN** `diasRestantes` devuelve `0` y la etiqueta es `Vence hoy`

#### Scenario: Límite inclusivo de riesgo

- **WHEN** `(fecha_entrega - hoy)` es exactamente igual a `diasAlertaRiesgo` y el avance es menor al umbral
- **THEN** el estado es `En riesgo`, porque la comparación es `<=`

### Requirement: Días restantes y etiqueta de plazo

El dominio DEBE (SHALL) devolver `diasRestantes` como entero con signo — positivo si faltan días, cero si vence hoy, negativo si pasó— y DEBE producir la etiqueta de UI correspondiente: `Faltan N días`, `Vence hoy`, `Pasó hace N días` o `Terminado`. La etiqueta DEBE calcularse en el dominio para que el frontend solo la renderice (RN-SEMAFORO-06, RN-GLOBAL-02).

#### Scenario: Faltan días

- **WHEN** la fecha de entrega está 3 días después de `hoy` en la zona indicada
- **THEN** `diasRestantes` devuelve `3` y la etiqueta es `Faltan 3 días`

#### Scenario: Pasó hace días

- **WHEN** la fecha de entrega está 2 días antes de `hoy` en la zona indicada y la OP no está terminada
- **THEN** `diasRestantes` devuelve `-2` y la etiqueta es `Pasó hace 2 días`

#### Scenario: Terminada

- **WHEN** la OP está terminada, incluso si la fecha aún no venció
- **THEN** la etiqueta es `Terminado` y el semáforo es `Terminado`

