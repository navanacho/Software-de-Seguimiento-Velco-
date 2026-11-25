# comparativa-horas-por-etapa Specification

## Purpose
TBD - created by archiving change desvios-y-margen-domain. Update Purpose after archive.
## Requirements
### Requirement: Comparativa pura por etapa con horas sin etapa asignada

`packages/domain/src/horas/` DEBE (SHALL) exponer `comparativaPorEtapa`, una función pura que reciba etapas con `horas_vendidas`, partes de horas con `etapaId` nullable y el avance derivado, y devuelva por etapa las horas vendidas, horas reales, desvío en horas y porcentaje de consumo. Los partes con `etapaId: null` DEBEN (SHALL) consolidarse en una fila sintética final con `etapaId: null` y `nombreEtapa: 'Sin etapa'`, sin imputarlos a ninguna etapa real (RN-HORAS-05, RN-HORAS-07, HU-15).

#### Scenario: Comparativa con etapas y partes vinculados

- **WHEN** una OP tiene dos etapas con `40.00` y `20.00` horas vendidas y partes reales de `36.00` y `22.00` horas vinculados a cada una
- **THEN** la fila de la primera etapa reporta desvío `+4.00` y consumo `90.00`, y la segunda reporta desvío `-2.00` y consumo `110.00`, como cadenas decimales exactas

#### Scenario: Horas sin etapa incluidas al final

- **WHEN** existen partes con `etapaId: null` además de partes vinculados
- **THEN** aparece una última fila `etapaId: null`, `nombreEtapa: 'Sin etapa'` con la suma exacta de esos partes y su desvío, sin modificar el orden de las etapas reales (HU-15)

#### Scenario: Etapa sin horas reales

- **WHEN** una etapa tiene horas vendidas y ningún parte imputado
- **THEN** la fila reporta horas reales `0.00`, desvío igual a las vendidas y consumo `0.00`, sin omitir la etapa ni lanzar excepción

#### Scenario: Sin etapas ni partes

- **WHEN** la OP no tiene etapas ni partes
- **THEN** la comparativa es una colección vacía y no se sintetiza la fila `Sin etapa` (RN-GLOBAL-03)

### Requirement: Reutilización de derivados canónicos y división por cero

`comparativaPorEtapa` DEBE (SHALL) reutilizar `calcularHorasVendidasTotales`, `calcularHorasRealesTotales`, `calcularDesvioHoras`, `calcularConsumoHoras` y `evaluarAlertaDesvio` de `packages/domain/src/horas/`; NO DEBE (SHALL NOT) reimplementar sumas, restas ni porcentajes propios. Con horas vendidas `0` en una fila, el porcentaje DEBE (SHALL) ser `null` y la alerta de esa fila DEBE (SHALL) evaluarse únicamente con `horas reales > horas vendidas` (RN-HORAS-01..04, RN-HORAS-06, RN-GLOBAL-02).

#### Scenario: Fila con vendidas cero y reales positivas

- **WHEN** una etapa tiene `0.00` horas vendidas y `1.00` horas reales
- **THEN** su porcentaje de consumo es `null` y la alerta se activa por `reales > vendidas`, sin divisiones por cero (RN-HORAS-06)

#### Scenario: Fila con vendidas cero sin reales

- **WHEN** una etapa tiene `0.00` horas vendidas y `0.00` horas reales
- **THEN** su porcentaje de consumo es `null` y la alerta no se activa

#### Scenario: Umbral de 15 puntos aplicado por fila

- **WHEN** una fila tiene consumo `96.00` y avance `80`
- **THEN** la alerta se activa porque `96.00 > 80 + 15`; con consumo `95.00` y avance `80` no se activa por igualdad estricta; el `15` es fijo y proviene de `evaluarAlertaDesvio` de C-08, sin parámetro de umbral

#### Scenario: Una sola implementación de horas

- **WHEN** se inspecciona la comparativa y su resultado
- **THEN** todos sus cálculos provienen de las funciones canónicas de C-08 y ningún valor se persiste en PostgreSQL (R2, R3, RN-GLOBAL-02)

