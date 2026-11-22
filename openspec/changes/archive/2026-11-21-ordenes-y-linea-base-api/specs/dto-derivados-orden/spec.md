## ADDED Requirements

### Requirement: `codigoPlano` en el DTO canónico de tarjeta

`TarjetaOrdenDTO` DEBE (SHALL) incluir `readonly codigoPlano: string | null` y `construirTarjetaOrden` DEBE (SHALL) copiarlo desde `OrdenTrabajo.codigoPlano` sin derivarlo, normalizarlo de nuevo ni convertir `null` en texto. El campo NO DEBE (SHALL NOT) considerarse un derivado: es dato persistido y transportado para que C-07 decida cómo renderizarlo (DD-11, RN-OP-05, R2, RN-GLOBAL-02).

#### Scenario: Tarjeta con plano

- **WHEN** se construye una tarjeta desde una OP con `codigo_plano = 'PL-2026-045'`
- **THEN** el DTO contiene `codigoPlano: 'PL-2026-045'` y ningún campo adicional de presentación

#### Scenario: Tarjeta sin plano

- **WHEN** se construye una tarjeta desde una OP con `codigo_plano = NULL`
- **THEN** el DTO contiene `codigoPlano: null`, sin convertirlo en `'Sin plano'` ni en cadena vacía

#### Scenario: Derivados intactos

- **WHEN** se construye la tarjeta con el campo nuevo
- **THEN** `avance`, `semaforo`, `diasRestantes`, `etapaAhora` y `etiquetaPlazo` siguen calculados por las mismas funciones puras y no se escribe ninguno en base de datos (R3)

#### Scenario: Constructor compartido

- **WHEN** el listado, el detalle y la respuesta de `PATCH` construyen una tarjeta
- **THEN** los tres usan `construirTarjetaOrden` y por los tres viaja `codigoPlano` con el mismo valor

### Requirement: Espejo de esquemas Zod en backend y frontend

Los esquemas Zod/JSON del backend (`backend/src/features/ordenes/http/esquemas.ts`) y el esquema de transporte del frontend (`frontend/src/shared/domain-client/esquemas.ts`) DEBEN (SHALL) declarar `codigoPlano` como `string` de longitud máxima 80 o `null`, manteniendo `z.ZodType<TarjetaOrdenDTO>` en el cliente para que el compilador detecte desincronizaciones. NO DEBE (SHALL NOT) usarse `any` ni una definición duplicada del DTO canónico (R2, R9).

#### Scenario: Respuesta del listado validada

- **WHEN** `GET /api/ops` devuelve tarjetas con `codigoPlano`
- **THEN** el esquema del frontend valida el valor y la tarjeta llega intacta al componente presentacional

#### Scenario: Campo ausente

- **WHEN** una respuesta de prueba omite `codigoPlano`
- **THEN** el esquema zod rechaza el cuerpo en lugar de completarlo con un valor por defecto

#### Scenario: Typecheck estricto

- **WHEN** se ejecuta el typecheck de dominio, backend y frontend
- **THEN** no hay errores ni apariciones de `any` derivadas del campo nuevo (R9)
