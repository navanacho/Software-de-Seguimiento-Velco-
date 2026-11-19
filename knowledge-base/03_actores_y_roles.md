# Actores y Roles

## Actores del sistema

| Actor | Descripción | Cómo interactúa |
|---|---|---|
| Gerente general | Dueño/responsable económico de Velco. **Único usuario del MVP.** | Usa el tablero, carga y edita OP, imputa horas, configura parámetros, ve todos los montos y exporta ambos Excel |
| Jefe de taller | Responsable de la ruta de fabricación y la carga de sectores | Consulta la tira *"Dónde está cada trabajo ahora"*, reordena etapas y marca avances (en el MVP lo ejecuta el gerente) |
| Presupuestista / administración | Prepara la línea base comercial | Carga horas vendidas por etapa, materiales cotizados y monto vendido (en el MVP lo ejecuta el gerente) |
| Operario | Ejecuta tareas en planta e imputa horas | En Fase 2 carga partes y avanza etapas **sin ver montos**; en el MVP no existe como cuenta |
| Encargado de planta | Opera la pantalla/TV del taller | En Fase 2 usa el modo Kiosco solo lectura (HU-08) |
| Sistema (no humano) | Procesos de cálculo y exportación | Deriva semáforo, avance, horas, márgenes y genera los dos `.xlsx` |

**Punto crítico de alcance:** en el MVP no hay tabla `usuarios`, no hay login ni mecanismo de autenticación, y no hay distinción técnica entre estos actores. Son responsabilidades que una sola persona realiza (R5). Ocultar montos en planta es una decisión deliberada de **Fase 2** según HU-19, no un olvido.

## RBAC — Matriz de permisos

### MVP v1.0 — acceso unificado

| Rol técnico | Recurso | Permisos (CRUD) |
|---|---|---|
| Único usuario (sin autenticación) | `ordenes_trabajo` | Crear, leer, actualizar, eliminar si se habilita |
| Único usuario | `etapas_orden` | Crear, leer, actualizar (incl. `completada` y orden), eliminar |
| Único usuario | `registros_horas` | Crear, leer, actualizar, eliminar (HU-13) |
| Único usuario | `materiales_orden` | Crear, leer, actualizar, eliminar |
| Único usuario | `clientes` | Crear, leer, actualizar |
| Único usuario | `configuracion` | Leer, actualizar (HU-18) |
| Único usuario | Exportación | `exportOp(opId, { incluirMargenes: true })` y `: false`; **ambas variantes visibles** |
| Único usuario | Dashboard histórico / importación | Sin acceso: no implementado en MVP |

La aplicación se despliega en un ámbito interno/intranet. La ausencia de login es una decisión de alcance, no una recomendación de seguridad para Internet.

### Fase 2 — roles planificados (NO implementar sin aprobación)

| Rol planificado (HU-19) | Tablero y etapas | Horas | Montos y márgenes | Exportación |
|---|---|---|---|---|
| `Admin/Oficina` | Ver y editar | Ver y editar | Sí | Costeo y OP con márgenes |
| `Taller` | Ver y marcar etapas | Cargar | No | Solo OP sin márgenes (`incluirMargenes: false`) |

Los documentos vigentes no definen otros roles ni un mecanismo de autenticación concreto: no hay PIN como diseño cerrado. Cualquier auth/PIN/RBAC requiere aprobación humana explícita (R5) antes de escribir código. `usuario_id` nullable en `registros_horas` es una extensión técnica a evaluar, no un requisito documentado.

## Rutas públicas

| Ruta / área | MVP | Fase 2 |
|---|---|---|
| `/` — tablero de tarjetas | Accesible sin autenticación | Según diseño de auth aprobado (R5) |
| `/ops/:id` — detalle de OP | Accesible sin autenticación | Según diseño de auth aprobado (R5) |
| `/ops/nueva`, `/ops/:id/editar` | Accesible sin autenticación | Según diseño de auth aprobado (R5) |
| `/configuracion` — valor hora y umbrales | Accesible sin autenticación | Según diseño de auth aprobado (R5) |
| `/exportar` (descargas por OP) | Accesible sin autenticación | Según diseño de auth aprobado (R5) |
| `/login` | No existe | No definido en docs vigentes; requiere aprobación (R5) |

> "Pública" en el MVP significa **sin control de acceso dentro de la app**, no expuesta a Internet. Ver [08_arquitectura_propuesta.md](08_arquitectura_propuesta.md).

## Fuentes

- `Docs/historias_de_usuario_velco.md` — HU-01, HU-02, HU-07, HU-10, HU-18, HU-19, HU-20A, HU-20B.
- `Docs/definici_n_del_mvp_velco.md` — ámbito HU-19 diferido.
- `Docs/MVP.md` no es fuente: borrado deliberado por obsoleto (IN-09). No define un PIN vigente.
- Decisiones 6, 7 y 9 de [09_decisiones_y_supuestos.md](09_decisiones_y_supuestos.md).
