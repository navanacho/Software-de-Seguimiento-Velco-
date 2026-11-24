## 1. Contratos y preparación

- [x] 1.1 Confirmar con el usuario OQ-1=A y OQ-2=A antes de tocar código de producción (confirmado 2026-11-24).
- [x] 1.2 Agregar en `packages/domain` los campos `horasVendidasTotales` y `horasRealesTotales` al DTO/constructor de tarjeta, con tests puros RED→GREEN→TRIANGULATE (con partes, sin partes) sin persistir derivados (R1, R3).
- [x] 1.3 Actualizar esquemas/tipos backend y frontend (`DetalleOpDTO`, `TarjetaOrdenDTO`, `ParteHoraDTO`) para reflejar horas reales y totales; mantener Zod como frontera y sin `any` (R9).
- [x] 1.4 Ajustar `GET /api/ops` y `GET /api/ops/:id` para poblar los totales desde dominio, con tests de integración/regresión necesarios y sin cálculos en handlers (R2, RN-GLOBAL-02).

## 2. Cliente frontend de horas

- [x] 2.1 Crear/actualizar cliente HTTP en `frontend/src/shared/domain-client` para `POST/GET/PATCH/DELETE /api/ops/:id/horas`, validando respuestas con Zod.
- [x] 2.2 Crear hooks TanStack Query para listar/refrescar horas y mutaciones crear/editar/eliminar con invalidación de `claveOrden` y claves de tablero.
- [x] 2.3 Agregar tests de hooks/clientes para manejo de 422/404 y refresco tras mutación.

## 3. UI de detalle (HU-10, HU-13)

- [x] 3.1 Implementar sección Horas en `DetalleOpPage`: listado de partes, estado vacío, y visualización de derivados del DTO sin cálculo local.
- [x] 3.2 Implementar modal/formulario "Cargar horas" con fecha, etapa opcional, operario y horas; validar `horas > 0` y campos requeridos antes de enviar.
- [x] 3.3 Implementar edición y eliminación de partes con feedback de error y refresco de detalle tras éxito.
- [x] 3.4 Agregar tests de componente: bloqueo por horas inválidas, alta actualiza lista, edición actualiza fila, eliminación quita fila, sin cálculos de negocio en componentes.

## 4. UI de tablero (HU-14 parcial C-09)

- [x] 4.1 Actualizar `TarjetaOrden` para mostrar barra/indicador `Horas Reales / Horas Vendidas` usando `horasRealesTotales/horasVendidasTotales` del DTO.
- [x] 4.2 Agregar acción "Cargar horas" en tarjeta que navegue a detalle con intención de abrir modal (OQ-2=A, confirmada 2026-11-24).
- [x] 4.3 Agregar/actualizar tests de tarjeta para renderizar barra desde DTO y ausencia de imports/cálculos de dominio.

## 5. Verificación y cierre

- [x] 5.1 Ejecutar tests relevantes frontend/domain/backend afectados por el change y corregir regresiones.
- [x] 5.2 Verificar guardianes: sin `any`, sin derivados persistidos, sin cálculo de negocio en React, sin auth agregada (R3, R5, R9, RN-GLOBAL-02).
- [x] 5.3 Ejecutar `openspec status --change "horas-reales-ui" --json` y `openspec validate --strict horas-reales-ui`; dejar el change listo para `/opsx:apply`.
