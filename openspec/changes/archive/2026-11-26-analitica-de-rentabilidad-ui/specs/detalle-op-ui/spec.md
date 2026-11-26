## MODIFIED Requirements

### Requirement: Alcance deliberado del detalle

La vista NO DEBE (SHALL NOT) mostrar exportación ni controles de edición de etapas o materiales: esas capacidades pertenecen a C-15 y al formulario de C-07. La vista SÍ DEBE (SHALL) incluir la gestión de horas reales (carga, edición, eliminación) definida por C-09 y la pestaña *Análisis de Rentabilidad* definida por `analitica-rentabilidad-ui`, que muestra los derivados de C-11 sin calcularlos ni duplicar reglas (HU-16, Flujo 5, RN-GLOBAL-02, R2).

#### Scenario: Horas reales disponibles

- **WHEN** el detalle trae `horas` con partes y derivados
- **THEN** la vista muestra la sección de horas reales con listado y acciones de carga/edición/eliminación, sin inventar valores

#### Scenario: Materiales de solo lectura

- **WHEN** se inspecciona la sección de materiales del detalle
- **THEN** no hay botones de editar ni borrar, coherentes con la ausencia de `PUT`/`DELETE` en C-06

#### Scenario: Pestaña de analítica disponible

- **WHEN** el usuario selecciona *Análisis de Rentabilidad* en `/ops/<uuid>`
- **THEN** la vista muestra la comparativa por etapa, el resumen de costos y margen y, si corresponde, la advertencia de tasa global no configurada, leyendo sólo los campos del DTO

#### Scenario: Sin edición de etapas ni materiales

- **WHEN** se inspeccionan la pestaña *Detalle* y la pestaña *Análisis de Rentabilidad*
- **THEN** no hay controles para editar o eliminar etapas ni materiales, y el enlace *Editar* continúa apuntando a `/ops/:id/editar` para el formulario de C-07
