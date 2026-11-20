# DD-06 — Clientes como entidad propia

Versión: 1
Estado: Aceptada

## Contexto

El mismo cliente aparece en muchas órdenes de producción y en los filtros de HU-09; los documentos vigentes no definen una entidad de clientes.

## Decisión

Extraer `clientes` como tabla con `id` y `nombre` único, y reemplazar `ordenes_trabajo.cliente VARCHAR(150)` por `cliente_id FK`. `registros_horas.operario` sigue siendo `VARCHAR(100)` libre con `usuario_id` nullable para el futuro.

## Alternativas

- Mantener el nombre libre en cada orden.
- Normalizar también operarios desde el inicio.

## Justificación

Evita duplicados e inconsistencias de nombres en filtros y exportaciones. Los operarios no tienen identidad de usuario en el MVP (DD-07).

## Trade-offs

Hay que dar de alta el cliente antes de la orden; no se valida razón social, CUIT ni dirección.

## Trazabilidad

[CHANGES.md](../../../../CHANGES.md) C-01, C-02; [design.md](../design.md) D1; [knowledge-base/09_decisiones_y_supuestos.md](../../../../knowledge-base/09_decisiones_y_supuestos.md) DD-06.
