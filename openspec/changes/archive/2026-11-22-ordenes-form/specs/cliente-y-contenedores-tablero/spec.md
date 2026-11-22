## MODIFIED Requirements

### Requirement: Adaptador HTTP delgado sin lógica de negocio

`frontend/src/shared/domain-client/` DEBE (SHALL) importar `TarjetaOrdenDTO`, `EtapaTarjeta`, `GrupoFlujo` y `EstadoSemaforo` desde `@velco/domain`, validar con zod el envelope de `GET /api/ops` y la tarjeta devuelta por `PATCH`, y declarar únicamente los tipos de transporte que el dominio no exporta. A partir de C-07 DEBE incluir además funciones tipadas para los endpoints de escritura ya publicados por C-06 —`POST /api/ops`, `PUT /api/ops/:id`, `POST /api/clientes`, `POST /api/ops/:id/etapas`, `PATCH /api/ops/:id/etapas/:etapaId/orden`, `DELETE /api/ops/:id/etapas/:etapaId`, `POST /api/ops/:id/materiales`— y esquemas Zod para los cuerpos de error 409 `codigo_plano_duplicado`, 409 `numero_op_duplicado` y 422 `validation_error`, sin redefinir DTOs ni reglas de negocio (RN-GLOBAL-02, R2, R9). NO DEBE (SHALL NOT) normalizar planos, calcular derivados ni decidir mensajes de error: solo transporta y valida (RN-OP-06).

#### Scenario: Tipos canónicos importados

- **WHEN** se inspeccionan los tipos usados por el cliente HTTP
- **THEN** `TarjetaOrdenDTO`, `EtapaTarjeta`, `GrupoFlujo` y `EstadoSemaforo` provienen de `@velco/domain` y no existen declaraciones duplicadas en el frontend

#### Scenario: Envelope validado en la frontera

- **WHEN** el cuerpo de `GET /api/ops` no respeta `{ ops, kpis, flujo }`
- **THEN** zod rechaza la respuesta antes de pasarla a la UI y no se renderizan tarjetas con datos parciales

#### Scenario: Sin cálculos en el cliente

- **WHEN** se inspecciona `shared/domain-client/`
- **THEN** no hay cálculo de avance, semáforo, plazos ni agrupamiento de flujo, y la construcción de la query usa los parámetros definidos por C-04

#### Scenario: Escritura tipada sin `any`

- **WHEN** se inspeccionan las funciones de escritura agregadas en C-07
- **THEN** sus argumentos y respuestas usan tipos derivados de esquemas Zod que espejan C-06, sin `any` y sin importar Fastify, Prisma ni `exceljs`

#### Scenario: Errores 409/422 parseados en la frontera

- **WHEN** una escritura responde 409 con `codigo_plano_duplicado` o `numero_op_duplicado`, o 422 con `details`
- **THEN** el cliente devuelve un valor discriminado y tipado que el formulario puede asociar con un campo, sin interpretar reglas de negocio

#### Scenario: Plano sin normalización en el cliente

- **WHEN** el formulario envía `"  pl-2026-045  "` al cliente de escritura
- **THEN** el cliente transporta ese valor sin `trim()` ni `toUpperCase()` y la normalización ocurre únicamente en el backend (RN-OP-06)
