## 1. Dominio: validación pura de parámetros (TDD)

- [x] 1.1 RED: escribir tests puros en `packages/domain/src/configuracion/` para rangos `valorHora >= 0`, `dias >= 0`, `0 <= porcentaje <= 100`, límites inclusive y cadenas decimales de hasta dos decimales
- [x] 1.2 GREEN: implementar el validador puro y el tipo de entrada sin frameworks ni `any`
- [x] 1.3 TRIANGULATE: agregar casos de plantilla `etapasDefault` vacía, nombre vacío, más de 100 caracteres y duplicados ignorando mayúsculas
- [x] 1.4 REFACTOR: exportar desde el barrel del paquete y verificar `npm run typecheck -w @velco/domain`

## 2. Persistencia del singleton (TDD con PostgreSQL real)

- [x] 2.1 RED: escribir tests de integración con el contenedor `postgres:18.7` para `obtener()` sobre `id = 1` y `actualizar()` con decimal exacto
- [x] 2.2 GREEN: ampliar `ConfiguracionRepository` con `actualizar()` e implementarlo en `PrismaConfiguracionRepository` sin upsert
- [x] 2.3 TRIANGULATE: reemplazar el tuple canónico de `convertirEtapasDefault` por lectura de arreglo validado y probar plantilla no canónica persistida
- [x] 2.4 REFACTOR: comprobar que sigue existiendo una sola fila tras varias actualizaciones y que el dominio no importa Prisma (R2/R10)

## 3. API `GET`/`PUT /api/configuracion` (TDD)

- [x] 3.1 RED: escribir tests HTTP con `app.inject()` y base real para lectura de defaults, actualización exitosa y relectura
- [x] 3.2 GREEN: crear esquemas Zod, caso de uso y `registrarRutas.ts` de la feature `configuracion`, y registrarlos en `backend/src/features/salud/http/app.ts`
- [x] 3.3 TRIANGULATE: probar `422` por negativos, porcentaje > 100, tipo incorrecto, exceso de decimales, plantilla vacía y duplicados, verificando que no hay escritura
- [x] 3.4 REFACTOR: confirmar que el OpenAPI expone ambos paths y que no se agregaron operaciones de alta o baja del singleton

## 4. Configuración vigente en la lectura de OPs (TDD)

- [x] 4.1 RED: escribir tests puros y de integración que cambien umbrales y tasa y verifiquen el semáforo recalculado y la tasa vigente inyectada en `ContextoTarjeta` en `GET /api/ops` y `GET /api/ops/:id`, sin calcular `margen` (C-11)
- [x] 4.2 GREEN: garantizar que listado, detalle y respuesta del `PATCH` de etapas construyan el contexto desde la configuración leída en ese momento, sin caché
- [x] 4.3 TRIANGULATE: cubrir el límite inclusivo de días, el cambio de tasa con horas reales y la división por cero sin persistir derivados
- [x] 4.4 REFACTOR: verificar que el semáforo tiene su única implementación en `packages/domain/`, que no aparece `calcularMargen` hasta C-11 y que no hay columnas nuevas (R3)

## 5. Vista `/configuracion` (TDD de componente)

- [x] 5.1 RED: escribir tests de componente para ruta, carga desde `GET`, validación local, envío de `PUT`, errores `422`, aviso de tasa y aviso de alcance de plantilla
- [x] 5.2 GREEN: crear `frontend/src/features/configuracion/{components,hooks,queries}/`, `ConfiguracionPage` con CSS Modules, cliente HTTP y esquema Zod espejo
- [x] 5.3 TRIANGULATE: registrar la ruta en `frontend/src/app/App.tsx` y agregar el enlace en el encabezado del tablero sin rediseñar la navegación
- [x] 5.4 REFACTOR: invalidar las consultas de configuración, tablero y detalle tras guardar y comprobar el repintado sin cálculo en React

## 6. Precarga del formulario de alta desde la API (TDD)

- [x] 6.1 RED: escribir tests que verifiquen precarga desde `GET /api/configuracion` y fallback canónico ante fallo
- [x] 6.2 GREEN: consumir la configuración en `OrdenFormPage` manteniendo el patrón contenedor/presentacional
- [x] 6.3 TRIANGULATE: comprobar que el `POST /api/ops` omite `etapas` si no se modifica la lista y las envía explícitas si se edita
- [x] 6.4 REFACTOR: actualizar cualquier constante obsoleta y confirmar que no queda lógica de negocio duplicada en el frontend

## 7. Verificación del change

- [x] 7.1 Ejecutar tests de dominio, backend y frontend y los typechecks de los tres workspaces (sin build)
- [x] 7.2 Ejecutar `openspec validate configuracion-global --strict` y revisar que los cinco delta specs estén sincronizables
- [x] 7.3 Registrar en `apply-progress.md` la evidencia RED/GREEN/TRIANGULATE/REFACTOR de cada grupo y los comandos ejecutados
