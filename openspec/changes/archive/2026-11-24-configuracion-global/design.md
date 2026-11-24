## Context

C-01..C-09 dejaron la tabla `configuracion` con su fila `id = 1` y sus defaults (RN-CONFIG-01/03), el contrato `Configuracion` en `packages/domain`, un `ConfiguracionRepository.obtener()` que ya inyecta umbrales al construir tarjetas, y un adaptador Prisma que **rechaza** cualquier `etapas_default` distinta del tuple canónico de cinco nombres. No existe `GET/PUT /api/configuracion` ni vista `/configuracion`. El C-07 dejó documentada la deuda de la constante hardcodeada en el alta de OP; el Flujo 7 y HU-18 exigen que los parámetros se editen sin código. C-10 corre en el GATE 8 en paralelo con C-11 y precede a C-12.

## Goals / Non-Goals

**Goals:**

- Publicar lectura y escritura del singleton con validación de rangos y de plantilla de etapas.
- Permitir editar valor hora, umbrales de riesgo y `etapas_default` desde `/configuracion`.
- Garantizar que los DTOs usen la configuración vigente en cada lectura, sin derivados persistidos.
- Resolver la deuda de precarga hardcodeada del formulario de OP sin cambiar la autoridad del backend sobre `etapas_default`.

**Non-Goals:**

- Auth, PIN, RBAC o tabla `usuarios` (R5; HU-19 es Fase 2).
- Nuevas migraciones, columnas derivadas o instantáneas históricas de tasa (R3).
- Rediseño del header, selector de tema ni dashboard (C-18 / HU-08).
- Tarifas por etapa/categoría (DD-04 / IN-02, diferidas).
- Cambios en el motor de exportación (C-13..C-16).

## Decisions

1. **Contrato HTTP único sobre el singleton, con decimales como cadena.** `GET /api/configuracion` responde con `{ id, valorHoraEstandar, diasAlertaRiesgo, porcentajeAvanceRiesgo, etapasDefault }`, con `id` fijo 1. `PUT /api/configuracion` acepta el cuerpo **sin `id`** —`valorHoraEstandar`, `diasAlertaRiesgo`, `porcentajeAvanceRiesgo` y `etapasDefault`—, el servidor aplica el reemplazo sobre la fila `id = 1` y un cuerpo con `id` extra se rechaza con `422` por `.strict()`. `valorHoraEstandar` viaja como `string` con hasta 2 decimales; el adaptador convierte con `Prisma.Decimal`, nunca `number`/`parseFloat` (RN-MARGEN-05, R9). Fuera de rango o tipo inválido ⇒ `422` con errores por campo. *Alternativa descartada:* enviar `number` — introduce coma flotante en un importe (R3/RN-MARGEN-05).

2. **Validación pura en `packages/domain/src/configuracion/`.** Los rangos `valor_hora >= 0`, `dias >= 0`, `0 <= porcentaje <= 100` y las reglas de `etapasDefault` viven en el dominio y se reutilizan en el límite HTTP y en el formulario; el adaptador Prisma solo persiste. *Alternativa descartada:* validar dentro del handler — duplicaría reglas y no sería testeable sin Fastify (R1/R2).

3. **`etapas_default` editable con plantilla abierta y validada.** Se reemplaza el `z.tuple([...])` de `etapas-default.ts` por validación de arreglo: al menos un nombre, `trim()` no vacío, máximo 100 caracteres y unicidad ignorando mayúsculas — las mismas reglas que C-06 aplica a las etapas de una OP. Los cinco nombres canónicos siguen siendo la semilla y el fallback; no se fuerza un taxón cerrado (RN-ETAPA-02/03, RN-CONFIG-02). *Alternativa descartada:* mantener el tuple — contradice HU-18 y RN-ETAPA-03. *Decisión a revisar:* prohibir plantillas vacías (ver Open Questions).

4. **Persistencia sin migración ni upsert.** Se amplía `ConfiguracionRepository` con `actualizar(configuracion)`, conservando `obtener()`; el adaptador ejecuta `update({ where: { id: 1 } })` sobre la fila sembrada. Si la fila no existe, es un error de entorno, no una oportunidad para crearla: el singleton lo garantiza la migración 001 (RN-CONFIG-03). *Alternativa descartada:* `upsert` — ocultaría una semilla faltante y permitiría más de un ciclo de vida del singleton.

5. **Sin caché de configuración; lectura fresca por request e invalidación en el cliente.** `contextoTarjeta` ya consulta el repositorio en cada construcción de DTO; se mantiene ese patrón para listado, detalle y recálculo posterior al `PATCH` de etapas. Tras un `PUT` exitoso, la UI invalida las claves de configuración, tablero y detalle de OP. *Alternativa descartada:* memorizar la configuración en procesos — dejaría el semáforo desactualizado y, cuando C-11 implemente el margen, también ese derivado frente a Flujo 7.

6. **Inyección de tasa en C-10, cálculo de margen en C-11.** No se guarda la tasa por OP ni se reprocesa historial: C-10 expone `valor_hora_estandar` vigente en `ContextoTarjeta.valorHoraEstandar` para que C-11 calcule el margen, y la vista `/configuracion` muestra el aviso correspondiente. C-10 NO calcula ni devuelve `margen` (Flujo 7, DD-04, R3). *Alternativa descartada:* columna `valor_hora_estandar` snapshot en `ordenes_trabajo` — violaría R3 y exigiría migración.

7. **Precarga del formulario desde la API con fallback canónico.** `/ops/nueva` consume `GET /api/configuracion`; si falla, usa los cinco nombres canónicos. Si el usuario no toca la lista, el `POST /api/ops` sigue omitiendo `etapas` para que el backend aplique su configuración autoritativa. Así se cierra la deuda de C-07 sin duplicar la regla de negocio en React. *Alternativa descartada:* enviar siempre la colección explícita — sobreescribiría cambios de plantilla posteriores y trasladaría autoridad al cliente.

8. **Navegación mínima, no rediseño.** Se agrega un enlace a `/configuracion` en el encabezado existente del tablero; la barra de pestañas completa del design system queda para C-18, que explícitamente excluye esta vista (Docs/design_system_velco.md:145).

9. **TDD estricto por capa.** Validación y efectos en el semáforo como tests puros (RED→GREEN→TRIANGULATE); singleton, rangos y persistencia como tests de integración con PostgreSQL real en contenedor (R1/R10); formulario y precarga como tests de componente sin lógica de cálculo en React (R2/R9).

## Risks / Trade-offs

- **[Cambio de tasa y cálculo de margen en C-11] →** C-10 inyecta la tasa vigente y muestra el aviso en la vista; el cálculo del margen con esa tasa se implementa en C-11 y el spec distingue ambos alcances. No hay snapshot ni backfill por R3.
- **[Cambio de `etapas_default` afecta solo OPs futuras] →** la vista indica que las OPs existentes conservan su ruta; no se reescriben etapas (RN-ETAPA-01).
- **[Escritura concurrente del singleton] →** último write gana; aceptable con usuario único del MVP (R5), sin control de versión.
- **[Caché obsoleta en el tablero tras guardar] →** invalidación explícita de consultas en el `mutation` de guardado y test de componente que verifica la reconsulta.
- **[Plantilla con nombres duplicados o vacíos] →** validación en dominio antes de persistir, con `422` y mensajes por índice.
- **[Descriptor `Puertos de repositorio` modificado en paralelo con C-11] →** C-11 no toca ese puerto; la única frontera compartida es la tasa inyectada, sin cambios de firma en sus funciones puras.

## Migration Plan

Sin cambios de esquema: la migración 001 ya crea `configuracion` con defaults y la fila `id = 1`. El despliegue consiste en registrar las nuevas rutas y publicar el cliente; rollback = revertir el commit y reinstalar el bundle anterior, sin restauración de datos. Si una plantilla inválida hubiera sido persistida por un despliegue parcial, se restaura mediante `PUT` con los cinco nombres canónicos.

## Open Questions

- ¿Debe admitirse una plantilla `etapasDefault` vacía? La propuesta opta por **no**: al menos una etapa, para evitar OPs sin ruta; requiere confirmación de Velco antes del apply si se considera válido un taller sin etapas predefinidas.
- ¿Es aceptable el `PUT` de reemplazo completo (no `PATCH` parcial) para el singleton? CHANGES.md especifica `PUT`, por lo que se adopta esa forma.
- SU-05 (zona horaria) e IN-02 (tasa por etapa) quedan fuera de alcance; no se resuelven aquí.
