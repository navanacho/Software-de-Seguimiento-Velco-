## Context

C-08 (`horas-reales-api`) está archivado: existen `POST/GET/PATCH/DELETE /api/ops/:id/horas`, `DetalleOpDTO` incluye `horas: ParteHoraDTO[]` y los derivados hermanos `horasRealesTotales`, `desvioHoras`, `porcentajeConsumo`, `alertaDesvio` calculados en dominio. `TarjetaOrdenDTO` y `GET /api/ops` no exponen horas reales (P-6=B en C-08).

Estado actual del frontend: `DetalleOpPage` muestra cabecera, estado, etapas y materiales, pero ignora `data.horas`; no hay feature de horas en `frontend/src/features/`; `TarjetaOrden` no muestra barra de horas; `frontend/src/shared/domain-client/{esquemas,tipos}` todavía tipan `horas` como `readonly never[]` en el espejo de detalle. La ruta `/ops/:id` y la navegación desde tarjeta ya existen (C-07).

Restricciones: R1 TDD estricto; R2 dominio puro; R3 sin derivados persistidos; R5 sin auth; R9 sin `any`; RN-GLOBAL-02 una sola implementación de regla. Gobernanza BAJO.

## Goals / Non-Goals

**Goals:**

- Permitir carga rápida de partes desde detalle (HU-10) con fecha, etapa opcional, operario texto libre y `horas > 0`.
- Permitir editar/eliminar partes en detalle (HU-13), con recálculo visible de totales desde el DTO refrescado.
- Mostrar barra `Horas Reales / Horas Vendidas` en tarjeta, alimentada por contrato de lectura, sin cálculo en React.
- Mantener componentes presentacionales sin lógica de negocio; mutaciones vía TanStack Query; validación de frontera en cliente con Zod antes de enviar.

**Non-Goals:**

- No implementar backend, migraciones, ni reglas nuevas de negocio en `packages/domain`.
- No agregar analítica de rentabilidad (C-11/C-12), configuración (C-10), exportación (C-14+), dashboard (C-17/C-18).
- No agregar auth/usuario_id (R5), Excel (R6), ni persistir derivados (R3).
- No modificar `GET /api/ops/:id/horas` más allá de consumirlo; no cambiar semántica de endpoints C-08.

## Decisions

### D1 — Contrato de lectura para la barra de tarjeta: extender `TarjetaOrdenDTO`

**Decisión:** agregar `horasVendidasTotales` y `horasRealesTotales` como `string` decimal al `TarjetaOrdenDTO` y al DTO de listado, calculados en `packages/domain` por las funciones ya existentes (`calcularHorasVendidasTotales`, `calcularHorasRealesTotales`) al construir la tarjeta/detalle. Actualizar `GET /api/ops`, esquemas Zod backend/frontend y specs delta (`dto-derivados-orden`, `api-listado-ops`/tablero según corresponda).

**Rationale:** CHANGES.md C-09 exige "barra ... alimentada por el DTO, sin cálculo en React". P-6=B de C-08 evitó tocar listado en ese momento, pero C-09 es el change correcto para enmendar el contrato con una delta spec explícita. Llevar los totales en el DTO mantiene RN-GLOBAL-02 y evita N+1/fetch por tarjeta.

**Alternativas consideradas:**

- *Fetch por tarjeta a `GET /api/ops/:id/horas` o `/api/ops/:id`*: simple pero genera N+1 en tablero y acopla tarjeta a detalle. Descartada por rendimiento y complejidad.
- *Calcular en React sumando etapas/partes*: viola RN-GLOBAL-02/R2 y duplicaría reglas. Descartada.
- *Campo agregado solo en envelope del tablero*: tercera forma de transportar el derivado; ambigua. Descartada.

**Trade-off:** requiere tocar dominio compartido, backend de listado y espejo frontend; se compensa con contrato canónico único y tests de regresión del tablero.

### D2 — Ubicación UI: horas en detalle de OP, disparador accesible desde tarjeta

**Decisión:** implementar la carga/edición completa en `DetalleOpPage` (sección Horas). En `TarjetaOrden`, mostrar solo la barra read-only y un enlace/acción "Cargar horas" que navegue a `/ops/:id?accion=cargar-horas` (o abra la ruta de detalle con estado de UI); el modal se monta en detalle. Esto evita duplicar formulario/modal y estado de mutación en el tablero.

**Rationale:** el detalle ya es la superficie de edición (HU-13). Reutiliza `useOrden`/invalidación de query y mantiene Tarjeta presentacional.

**Alternativa:** modal embebido en tarjeta. Descartada por complejidad de estado, accesibilidad en grilla y duplicación.

### D3 — Mutaciones TanStack Query con invalidación dirigida

**Decisión:** crear hooks `useCrearHora`, `useActualizarHora`, `useEliminarHora` en `frontend/src/features/ordenes/hooks/` (o `horas/` si se separa). Tras éxito, invalidar `claveOrden(ordenId)` y las claves del tablero (`['tablero']`/filtro activo) para que detalle y tarjeta reflejen derivados frescos. No hacer cálculo optimista de totales derivados; el optimismo solo se permite si no afecta derivados mostrados, pero por simplicidad se usa invalidación + estado de carga.

**Rationale:** los derivados vienen del servidor/dominio; recalcularlos en cliente violaría RN-GLOBAL-02. Invalidación es correcta y barata en MVP.

**Alternativa:** optimismo completo con rollback. Descartada: requiere replicar derivado o mostrar estado inconsistente.

### D4 — Validación de frontera en cliente, sin duplicar reglas de negocio

**Decisión:** validar en formulario con Zod/esquema local: `horas` numérico decimal > 0, `operario` requerido, `fecha` requerida, `etapaId` opcional. Esta validación es de UX/frontera; el backend sigue siendo autoridad (422). No se calculan desvíos/consumos/alertas en frontend.

**Rationale:** HU-10 pide validación `horas > 0`; R1/RN-GLOBAL-02 exige no duplicar regla de negocio. La validación de forma/positividad en input es frontera, no derivado.

### D5 — Componentes presentacionales y pruebas

**Decisión:** separar `ModalCargarHoras`/`FormularioParteHora` (presentacional o container pequeño), `ListaPartesHoras` (presentacional con callbacks), y contenedor en `DetalleOpPage`. Tests con Vitest + Testing Library, mockeando `fetch`/cliente HTTP como ya hacen tests frontend; sin mocks de PostgreSQL. Casos mínimos: validación horas <= 0 bloquea submit; alta exitosa refresca lista; edición actualiza fila; eliminación quita fila; tarjeta renderiza barra desde DTO sin importar funciones de cálculo.

**Rationale:** patrón Container/Presentational del repo y R1.

## Risks / Trade-offs

- [P-6=B de C-08 se enmienda] → Mitigación: delta spec explícita en `dto-derivados-orden` y spec de listado/tablero; documentar en design y proposal; tests de regresión de contratos.
- [N+1 evitado pero listado hace más trabajo] → Mitigación: calcular totales en construcción de tarjeta en dominio usando datos ya cargados (etapas para vendidas, partes/aggregate para reales); verificar consulta Prisma eficiente.
- [Invalidación de tablero tras mutar horas desde detalle] → Mitigación: invalidar `['tablero']` y `claveOrden`; test de integración UI verifica refresco.
- [Desfase de esquema frontend con backend] → Mitigación: actualizar `esquemas.ts`/`tipos.ts` primero en TDD y validar con Zod en cliente HTTP.
- [Accesibilidad del modal] → Mitigación: usar `<dialog>` o patrón accesible simple; foco, escape, labels; cubrir en tests.

## Migration Plan

1. Actualizar contratos compartidos/tipos (dominio + esquemas Zod back/front) con TDD.
2. Ajustar backend listado/detalle para poblar nuevos campos de DTO; mantener compatibilidad aditiva.
3. Implementar cliente HTTP y hooks de mutación de horas.
4. Implementar UI detalle (lista + modal) y tarjeta (barra).
5. Verificar regresiones tablero/detalle existentes; `openspec validate --strict`.

Rollback: revertir change; campos aditivos en DTO no rompen consumidores que ignoren propiedades desconocidas, pero el revert debe incluir frontend y backend juntos.

## Open Questions

**Cerradas el 2026-11-24 por confirmación explícita del usuario.** No quedan decisiones abiertas antes del apply.

### OQ-1 — Totales de horas en `TarjetaOrdenDTO`/listado → **A (elegida)**

- **Elegida A (confirmada):** agregar `horasVendidasTotales` y `horasRealesTotales` como cadenas decimales al `TarjetaOrdenDTO` y al listado, calculados en dominio con funciones puras canónicas; delta spec explícita sobre `dto-derivados-orden` y specs de tablero/listado según corresponda. *Justificación:* cumple el alcance literal de C-09 (“alimentada por el DTO, sin cálculo en React”) y mantiene RN-GLOBAL-02/R3. Enmienda P-6=B de C-08 de forma explícita y trazable.
- **Descartada B:** fetch de detalle/horas por tarjeta. *Trade-off:* N+1, más estado y peor UX.
- **Descartada C:** barra solo en detalle. *Trade-off:* no cumple el scope literal de C-09.

### OQ-2 — Alta desde tarjeta → **A (elegida)**

- **Elegida A (confirmada):** la acción “Cargar horas” en tarjeta navega a `/ops/:id` con intención de abrir el modal de carga en detalle (query param o estado de navegación). *Justificación:* reutiliza el flujo de detalle, evita duplicar modal/mutaciones en grilla y simplifica accesibilidad.
- **Descartada B:** modal embebido en tarjeta. *Trade-off:* duplica estado, complica foco y aumenta superficie de prueba.

### OQ-3 — Campos expuestos → **Resuelta por OQ-1=A**

Se exponen ambos campos necesarios para el texto/barra: `horasVendidasTotales` y `horasRealesTotales`. No se exponen porcentajes adicionales en tarjeta salvo que ya existan en DTO; el texto `reales / vendidas` se forma con los dos campos del DTO.
