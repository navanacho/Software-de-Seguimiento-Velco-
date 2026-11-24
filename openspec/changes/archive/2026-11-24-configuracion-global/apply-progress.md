## Apply Progress: configuracion-global

**Change**: `configuracion-global` (C-10)  
**Schema**: `spec-driven`, 27/27 tareas completas en `tasks.md`  
**Estado**: implementación cerrada con TDD estricto (R1); sin build, sin commit, sin push.

### Criterio de evidencia

- **VALIDADO AHORA**: comando ejecutado en esta sesión con resultado capturado.
- **RED observado**: el test se ejecutó antes de la implementación y falló por la ausencia del comportamiento.
- No se inventaron ejecuciones históricas: los conteos puntuales no capturados se describen cualitativamente.

### TDD Cycle Evidence

| Task | Test file | Layer | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|
| 1.1–1.4 Validador de configuración | `packages/domain/src/configuracion/validar.test.ts` | Unit (dominio) | RED observado: decimal, rangos y plantilla sin implementación | `npm test -w @velco/domain` → 13 archivos, 61/61 | Válidos, límites inclusivos, duplicados case-insensitive y decimales inválidos | Reglas exportadas desde `packages/domain/src/index.ts`; sin dependencias de framework (R2) |
| 2.1–2.4 Persistencia del singleton | `backend/test/configuracion-global/persistencia.test.ts`, `backend/test/core-order-models/etapas-default.test.ts` | Integración PostgreSQL real | RED observado: `actualizar()` ausente | 3/3 en persistencia; 4/4 en `etapas-default` | Relectura decimal exacta, una sola fila `id=1`, plantilla inválida rechazada | `Prisma.Decimal`, sin upsert y sin migración nueva (R3) |
| 3.1–3.4 API `GET`/`PUT` | `backend/test/configuracion-global/api.test.ts`, `openapi.test.ts` | HTTP / OpenAPI | RED observado: rutas y esquemas ausentes | 5/5 en API; 1/1 en OpenAPI | 422 por rango, tipo, decimal y plantilla; singleton sin operaciones de alta/baja | Registro en `backend/src/features/salud/http/app.ts`; OpenAPI expone solo `get`/`put` |
| 4.1–4.4 Configuración vigente | `backend/test/configuracion-global/lectura-op.test.ts`, `sin-derivados.test.ts` | Unit + integración | RED observado: contexto con valores fijos | 6/6 en lectura; 3/3 en sin-derivados | Límite inclusivo de días, cambio de tasa con horas reales y tasa alta sin derivados no finitos | `contextoTarjeta()` lee en cada request; `calcularMargen` sigue prohibido hasta C-11 (R3) |
| 5.1–5.2 Vista `/configuracion` | `frontend/src/features/configuracion/ConfiguracionPage.test.tsx` | Componente | RED observado: pantalla y validación ausentes | 6/6 en el archivo | Carga, 422, rango inválido, duplicado y representación completa del `PUT` | Debug removido; `noValidate`; `mutationFn` envuelto para evitar el segundo argumento de TanStack Query |
| 5.3–5.4 Ruta, enlace e invalidación | `frontend/src/app/App.configuracion.test.tsx`, `frontend/src/features/tablero/TableroPage.configuracion.test.tsx`, `frontend/src/features/configuracion/guardian.test.ts` | Routing / componente | RED observado: `Unable to find ... "Configuración"` | 2/2 en ruta/enlace; 6/6 + 3/3 en configuración + guardian | Tras guardar se invalidan `['configuracion']`, `['tablero']` y `['orden']` | Guardian prohíbe `calcularMargen`, `calcularSemaforo`, reloj, storage y `any` |
| 6.1–6.3 Precarga del alta | `frontend/src/features/ordenes/OrdenFormPage.configuracion.test.tsx` | Contenedor / componente | RED observado: `Etapa 3` mostraba `Mecanizado` en vez de `Entrega` | 4/4 tras conectar `useEtapasPrecargadas` | GET con plantilla, fallback ante fallo, `POST` sin `etapas` y `POST` con etapas editadas | `useMemo` estabiliza la plantilla; `useEffect` respeta `etapasModificadas` |
| 6.4 REFACTOR frontend | `frontend/src/features/ordenes/configuracion.guardian.test.ts` | Guardian de arquitectura | RED observado: guardian inicial demasiado amplio (falló por `new Date()` legítimo en `fechaCalendario.ts`) | 3/3 tras limitar la aserción a reglas C-10 | Plantilla canónica solo en `precargaEtapas.ts`; sin umbrales/tasa en `features/ordenes` | Cliente HTTP compartido; contenedor/presentacional preservado |
| 7.1–7.3 Verificación | `verify-report implícito` | Verification | N/A | Todas las suites verdes; ver tabla de comandos | Tres workspaces + strict validation | Sin build; solo `tasks.md` y este archivo se editaron dentro de `openspec/` |

### Comandos ejecutados

| Comando | Resultado |
|---|---|
| `npx vitest run src/features/configuracion/ConfiguracionPage.test.tsx` | 1 archivo, 5/5 al cierre de 5.2 |
| `npx vitest run src/app/App.configuracion.test.tsx src/features/tablero/TableroPage.configuracion.test.tsx` | 2 archivos, 2/2 |
| `npx vitest run src/features/configuracion/ConfiguracionPage.test.tsx src/features/configuracion/guardian.test.ts --reporter=verbose` | 2 archivos, 9/9 (antes del test de invalidación adicional) |
| `npx vitest run src/features/ordenes/OrdenFormPage.configuracion.test.tsx --reporter=verbose` | RED esperado → GREEN 1 archivo, 4/4 |
| `npx vitest run src/features/ordenes/configuracion.guardian.test.ts --reporter=verbose` | 1 archivo, 3/3 |
| `npx vitest run test/fundacion/alcance.test.ts test/tablero-read-api/smoke.test.ts --reporter=verbose` | 2 archivos, 5/5 (tras quitar literal `login\|PIN` del test) |
| `npm test -w @velco/domain` | 13 archivos, 61/61 |
| `npm test -w @velco/backend -- --fileParallelism --maxWorkers=2 --reporter=dot --no-color` | 58 archivos, 199/199 |
| `npm test -w @velco/frontend` | 46 archivos, 174/174 |
| `npm run typecheck -w @velco/domain` | OK |
| `npm run typecheck -w @velco/backend` | OK |
| `npm run typecheck -w @velco/frontend` | OK |
| `openspec validate configuracion-global --strict` | `Change 'configuracion-global' is valid` |

### Desviaciones conocidas

- C-10 **no implementa `calcularMargen` ni campo `margen`**: `backend/test/fundacion/ubicacion-reglas.test.ts:181-187` lo prohíbe hasta C-11. Se expone `valorHoraEstandar?: string` en `ContextoTarjeta` y la UI informa que los márgenes se recalculan con la tasa vigente.
- El backend usa `fileParallelism: false` en su configuración; para completar la verificación en tiempo razonable se usó un override de CLI (`--fileParallelism --maxWorkers=2`). No se modificó `backend/vitest.config.ts`.
- Con `--maxWorkers=4`, `smoke.test.ts` excedió el timeout por contención de contenedores; aislado y con 2 workers pasó (5/5 en el comando combinado y 199/199 en la suite completa).
- No se agregaron migraciones, columnas derivadas, auth/PIN/RBAC ni plantillas `.xlsx` (R3/R5/R6).
