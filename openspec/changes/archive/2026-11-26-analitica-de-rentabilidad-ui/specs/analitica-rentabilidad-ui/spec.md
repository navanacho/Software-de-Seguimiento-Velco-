## ADDED Requirements

### Requirement: Pestaña de análisis de rentabilidad en el detalle

La vista de detalle DEBE (SHALL) ofrecer una pestaña *Análisis de Rentabilidad* junto a la pestaña *Detalle*, accesible desde `/ops/:id`, con estado local de interfaz y sin iniciar una consulta nueva ni calcular derivados en React. La pestaña *Detalle* DEBE ser la seleccionada por defecto para conservar el comportamiento existente de C-09 (HU-16, RN-GLOBAL-02, patrón contenedor/presentacional).

#### Scenario: Acceso a la pestaña desde el detalle

- **WHEN** el usuario abre `/ops/<uuid>` con un detalle válido
- **THEN** se muestran las pestañas *Detalle* y *Análisis de Rentabilidad*, y el contenido analítico aparece sólo al seleccionar la segunda

#### Scenario: Estado inicial conservado

- **WHEN** se renderiza el detalle por primera vez
- **THEN** la pestaña *Detalle* está seleccionada y la sección de horas reales de C-09 sigue visible sin acción adicional

#### Scenario: Sin cálculo ni petición adicional

- **WHEN** el usuario cambia de pestaña
- **THEN** los componentes leen únicamente los campos del `DetalleOpDTO` validado por `EsquemaDetalleOp`, sin importar funciones de `packages/domain/src/horas/` ni de `packages/domain/src/margen/` y sin invocar `GET /api/ops/:id` de nuevo

### Requirement: Tabla comparativa por etapa con horas sin etapa

La pestaña DEBE (SHALL) renderizar `comparativaPorEtapa` como una tabla con una fila por `FilaComparativaPorEtapa`, mostrando `nombreEtapa`, `horasVendidas`, `horasReales`, `desvioHoras`, `porcentajeConsumo` y `alertaDesvio` exactamente como vienen del dominio. La fila con `etapaId: null` DEBE (SHALL) mostrarse con el literal `Sin etapa` y un estilo distintivo, sin fusionarla con otra etapa ni omitirla. Un `porcentajeConsumo` `null` DEBE (SHALL) mostrarse como `—`, nunca como `NaN`, `Infinity` ni `0.00%` (HU-15, RN-HORAS-06, C-11).

#### Scenario: Comparativa con horas sin etapa

- **WHEN** la respuesta trae tres etapas y una fila final `etapaId: null`, `nombreEtapa: "Sin etapa"` con horas imputadas
- **THEN** la tabla muestra cuatro filas en el mismo orden del DTO, con la última identificada como *Sin etapa* y distinguida visualmente

#### Scenario: Consumo nulo en una fila

- **WHEN** una fila trae `porcentajeConsumo: null` porque no hay horas vendidas en esa etapa
- **THEN** la celda muestra `—` y la fila NO muestra `NaN`, `Infinity` ni un porcentaje inventado

#### Scenario: Alerta por fila sin comparar el umbral

- **WHEN** una fila trae `alertaDesvio: true` y otra `false`
- **THEN** sólo la primera muestra el badge *Alerta de desvío de horas*, sin que el componente compare porcentajes ni conozca el umbral 15

### Requirement: Resumen de costos y margen reales

La pestaña DEBE (SHALL) mostrar `montoVendido`, `costoMaterialesCotizado`, `costoMaterialesReal` y `margenReal` como cadenas decimales exactas del `DetalleOpDTO`, identificando cada importe con su etiqueta y aplicando el formato de presentación definido en este capability. NO DEBE (SHALL NOT) calcular el margen, sustituir un importe por otro ni usar el costo cotizado en lugar del real (HU-16, Flujo 5, RN-MARGEN-05, R2).

#### Scenario: Rentabilidad con tasa configurada

- **WHEN** el detalle trae `montoVendido: "1000.00"`, `costoMaterialesCotizado: "200.00"`, `costoMaterialesReal: "240.00"` y `margenReal: "160.00"`
- **THEN** el resumen muestra los cuatro importes con esos valores, con el margen calculado por el dominio y sin operaciones aritméticas en el componente

#### Scenario: Margen negativo

- **WHEN** `margenReal` es `"-33.75"`
- **THEN** el resumen muestra `-33.75` con el signo conservado y NO lo convierte en cero ni en valor absoluto

### Requirement: Advertencia de tasa global no configurada

Cuando `tasaGlobalNoConfigurada` sea `true`, la pestaña DEBE (SHALL) mostrar un Mensaje de estado que indique que el valor hora estándar se encuentra en `0.00` y debe configurarse. El componente DEBE (SHALL) mostrar `margenReal` tal como llegó, sin ocultarlo, recalcularlo ni reemplazarlo (RN-CONFIG-01, DD-04, IN-02, Flujo 5).

#### Scenario: Tasa global en cero

- **WHEN** el detalle trae `tasaGlobalNoConfigurada: true` y `margenReal: "760.00"`
- **THEN** se muestra la advertencia de configuración junto al margen `760.00`, sin modificar el importe

#### Scenario: Tasa global configurada

- **WHEN** el detalle trae `tasaGlobalNoConfigurada: false`
- **THEN** NO se muestra la advertencia de configuración y el margen se presenta únicamente con su etiqueta

### Requirement: Formato decimal de solo presentación

El frontend DEBE (SHALL) dar formato a dos decimales a los importes y a los porcentajes únicamente en la capa de presentación, mediante operaciones sobre cadenas decimales exactas. El formateador de importes DEBE (SHALL) redondear el tercer decimal hacia arriba con acarreo y conservar el signo; el de porcentajes DEBE (SHALL) recortar ceros finales y representar `null` como `—`. NO DEBE (SHALL NOT) usarse `Number`, `parseFloat`, `toFixed`, `Math` ni funciones de cálculo del dominio (RN-MARGEN-05, R2, R9).

#### Scenario: Redondeo con acarreo

- **WHEN** se formatea el importe `"12.3450"`
- **THEN** se muestra `12.35`, sin conversión a coma flotante

#### Scenario: Importe negativo

- **WHEN** se formatea el margen `"-33.7500"`
- **THEN** se muestra `-33.75`, conservando el signo

#### Scenario: Porcentaje exacto y nulo

- **WHEN** se formatean `"80.00"` y `null`
- **THEN** se muestran `80%` y `—` respectivamente
