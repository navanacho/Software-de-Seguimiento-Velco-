## Why

C-01 dejó el workspace, el esqueleto feature-based y un `schema.prisma` vacío a propósito, pero todavía no existe ninguna tabla ni contrato de persistencia para la entidad raíz del sistema. Sin la migración 001 y sus repositorios, C-03 no tiene de dónde derivar avance y semáforo, y C-04 no tiene datos reales que servir al tablero. Este change instala el modelo mínimo y hace que PostgreSQL, no la UI, garantice unicidad, unicidad referencial y el singleton de configuración.

## What Changes

- Agregar la migración 001 con `configuracion` (fila singleton `id=1`), `clientes` (`nombre` único), `ordenes_trabajo` (`numero_op` único, `cliente_id` FK RESTRICT, `monto_vendido NUMERIC(14,2)`) y `etapas_orden` (`orden_id` FK CASCADE, único `(orden_id, orden_secuencia)`), con `UUID`, `JSONB` y `TIMESTAMPTZ` donde corresponda (RN-OP-01, RN-ETAPA-02, RN-CONFIG-01..03; DD-03, DD-06).
- Definir los modelos Prisma 7.10.1 que mapean esas cuatro tablas, con `Decimal` para importes y horas, `JsonValue` para `etapas_default` y las semánticas `onDelete: Restrict` / `Cascade` declaradas en el esquema.
- Declarar los puertos `ConfiguracionRepository`, `ClienteRepository`, `OpRepository` y `EtapaRepository` en `backend/src/features/<feature>/application/ports/`, e implementarlos con adaptadores Prisma dentro de la misma feature, sin importar Prisma ni Fastify desde el dominio (R2, R9).
- Cargar el seed mínimo: `valor_hora_estandar=0`, `dias_alerta_riesgo=3`, `porcentaje_avance_riesgo=80` y `etapas_default=["Corte","Soldadura","Mecanizado","Pintura","Entrega"]`; el seed no crea clientes, OPs ni etapas de ejemplo en producción y no existe tabla `usuarios` (R5, DD-07).
- No persistir `porcentaje_avance`, totales de horas, agregados de materiales, costos, margen ni semáforo: esos derivados se calculan en C-03 (R3, DD-03).
- Verificar la integridad con tests de integración Vitest sobre PostgreSQL 18.7 real en contenedor: unicidad de `numero_op`, unicidad de `nombre` de cliente, CASCADE al borrar una OP, RESTRICT al intentar borrar un cliente con OPs y singleton de configuración (R1, R10).

Fuera de alcance: endpoints HTTP, casos de uso de alta o edición de OP, materiales, horas, reglas de semáforo o avance, plantillas Excel, auth/PIN/RBAC y datos demo de tablero. No hay cambios rompientes porque C-01 no contiene datos de negocio.

## Capabilities

### New Capabilities

- `modelo-relacional-ordenes`: esquema físico de la migración 001, tipos `NUMERIC`, llaves, constraints de unicidad y integridad referencial, fila singleton de configuración y seed mínimo.
- `modelos-prisma-ordenes`: modelos Prisma que representan las cuatro tablas con sus relaciones, escalas decimales y ausencia de columnas derivadas.
- `puertos-persistencia-ordenes`: contratos de repositorio por feature y sus adaptadores Prisma, con el dominio libre de frameworks y tipado estricto.

### Modified Capabilities

- `entorno-desarrollo`: el requisito "Esquema Prisma inicializado sin modelos de negocio" pasa a "Esquema Prisma con los modelos core de C-02 y sin valores derivados"; se conservan la fijación de Prisma 7.10.1, PostgreSQL 18.7 y la prohibición de columnas calculadas.

## Impact

- Persistencia: nuevos archivos en `backend/prisma/migrations/001_*`, `backend/prisma/schema.prisma` con cuatro modelos y `backend/prisma/seed.*`; la BD de desarrollo ya levantada por `docker-compose.yml` requiere aplicar la migración y el seed.
- Backend: nuevas carpetas `backend/src/features/{configuracion,clientes,ordenes,etapas}/{application/ports,prisma}/`; ningún endpoint ni handler nuevo en este change.
- Dominio: `packages/domain/` no incorpora reglas ni dependencias; debe seguir compilando aunque se eliminen todos los adaptadores por feature (R2).
- Dependencias: no se agregan paquetes; se usan las versiones fijadas en C-01 (`@prisma/client` y `prisma` 7.10.1, `@testcontainers/postgresql` 12.2.2, Vitest 5.1.1, TypeScript 7.0.2).
- Documentación: `openspec/` se gestiona solo por CLI (R8); `CHANGES.md` no se modifica hasta el archivado.
