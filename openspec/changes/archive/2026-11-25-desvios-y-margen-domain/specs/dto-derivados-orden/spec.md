## ADDED Requirements

### Requirement: Derivados de comparativa, costos y margen en el detalle canónico

El dominio DEBE (SHALL) ampliar `DetalleOpDTO` —construido por la misma función pura que produce la tarjeta— con los campos derivados `comparativaPorEtapa`, `costoMaterialesCotizado`, `costoMaterialesReal`, `margenReal` y `tasaGlobalNoConfigurada`. Estos campos DEBEN (SHALL) calcularse con las reglas puras de `packages/domain/src/horas/` y `packages/domain/src/margen/`, usando la tasa global vigente inyectada en `ContextoTarjeta.valorHoraEstandar` (HU-14/15/16, Flujo 5, RN-GLOBAL-02, DD-04, IN-02).

#### Scenario: Detalle con rentabilidad calculada

- **WHEN** se construye el detalle de una OP con etapas, partes, materiales y un contexto con tasa `12.50`
- **THEN** el DTO contiene la comparativa por etapa, ambos agregados de materiales y el margen real calculado en dominio, sin que el handler ni React los calculen

#### Scenario: Detalle con tasa no configurada

- **WHEN** la tasa inyectada es `0.00`
- **THEN** `margenReal` contiene `montoVendido - costoMaterialesReal` y `tasaGlobalNoConfigurada` es `true`, sin lanzar ni devolver `null` (Flujo 5, RN-CONFIG-01)

#### Scenario: División por cero transportada

- **WHEN** una OP tiene horas vendidas `0.00` con partes imputados
- **THEN** el porcentaje de consumo de la tarjeta y de cada fila de la comparativa viaja como `null` y la alerta se calcula con `reales > vendidas` (RN-HORAS-06)

#### Scenario: Sin persistencia de los campos nuevos

- **WHEN** se inspeccionan `schema.prisma`, las migraciones y la respuesta del detalle
- **THEN** ninguno de los campos nuevos se escribe en PostgreSQL ni aparece como columna (R3)

### Requirement: Transporte de los derivados sin duplicación de reglas

La API DEBE (SHALL) servir los campos nuevos tal como los produce el dominio, sin invocar fórmulas en los handlers ni reordenar la comparativa. El espejo Zod del frontend DEBE (SHALL) declararlos con los mismos tipos —cadenas decimales exactas, `null` donde corresponda y el arreglo de comparativa— manteniendo `z.ZodType<DetalleOpDTO>` sin `any` (RN-GLOBAL-02, R2, R9). La representación visual, las alertas y el formato a dos decimales corresponden a C-12; este change no las implementa.

#### Scenario: Consumo por la API

- **WHEN** un handler responde `GET /api/ops/:id`
- **THEN** los campos de rentabilidad son exactamente los del DTO del dominio y no hay cálculo adicional en el adaptador HTTP

#### Scenario: Consumo por el espejo del cliente

- **WHEN** el frontend valida una respuesta con comparativa y margen
- **THEN** el esquema Zod los acepta sin completarlos con valores por defecto y sin definir una segunda versión de las reglas

#### Scenario: Sin cálculo en React

- **WHEN** un componente posterior (C-12) renderiza el detalle
- **THEN** muestra los valores del DTO y no importa funciones de horas ni de margen ni compara importes por su cuenta

#### Scenario: Contrato compartido

- **WHEN** backend y frontend necesitan los tipos nuevos
- **THEN** ambos los importan desde `packages/domain` o los espejan con `z.infer`, sin definiciones duplicadas ni `any` (R9)
