# Design System — Sistema de Seguimiento de Taller (Velco)

Este documento define los tokens visuales, tipografías, paleta de colores, anatomía de componentes y reglas de interfaz del sistema de **Velco**, basado en la estética industrial de alta legibilidad del prototipo `tablero-taller-v2.html`.

---

## 1. Identidad Visual y Principios de Diseño

* **Estética Industrial / Taller:** Alto contraste, bordes definidos (esquinas rectas o radios mínimos de `0px` a `2px`), franja superior de precaución amarilla/negra y bloques de color sólidos para lectura rápida tanto en oficina como en monitores de planta.
* **Jerarquía de Escaneo Rápido:** Los números críticos (N° de OP, porcentajes, horas acumuladas, KPIs) utilizan tipografía condensada de alto impacto (`Barlow Condensed`), mientras que textos descriptivos y formularios utilizan tipografía limpia (`Barlow`).
* **Soporte Nativo Claro / Oscuro:** Tokens CSS variables preparados para alternar entre modo día (oficina) y modo oscuro (monitores de taller con baja luz) sin perder contraste en los semáforos.

---

## 2. Tokens de Color (CSS Custom Properties)

### Modo Claro (`:root` / Default)
| Token | Valor Hex | Uso Principal |
| :--- | :--- | :--- |
| `--bg` | `#e9edf0` | Fondo general de la aplicación |
| `--surface` | `#ffffff` | Fondo de tarjetas, KPIs, modales y tablas |
| `--head` | `#13202b` | Barra de navegación superior (`header`) y pasos de flujo |
| `--ink` | `#16212a` | Texto principal de alto contraste |
| `--mute` | `#5a6772` | Etiquetas secundarias, subtítulos, textos tachados |
| `--line` | `#cfd7dd` | Bordes de tarjetas, divisores e inputs |
| `--track` | `#dde3e8` | Fondo inactivo de anillos de progreso y barras |
| `--yel` | `#f2b705` | Acento industrial Velco, franja hazard, badge **`ahora`** |
| `--accent` | `#1f5f8b` | Botones primarios, focos de teclado (`outline`), enlaces |

### Modo Oscuro (`[data-theme="dark"]` / `prefers-color-scheme: dark`)
| Token | Valor Hex | Uso Principal |
| :--- | :--- | :--- |
| `--bg` | `#0f1418` | Fondo general oscuro |
| `--surface` | `#1a2229` | Superficie de tarjetas y contenedores |
| `--head` | `#0a0f13` | Barra de navegación superior |
| `--ink` | `#e8edf0` | Texto principal claro |
| `--mute` | `#93a1aa` | Texto secundario apagado |
| `--line` | `#2c373e` | Bordes y separadores |
| `--track` | `#2a343b` | Fondo de barras y anillos inactivos |
| `--accent` | `#5aa8d8` | Acciones primarias en modo oscuro |

### Colores Semánticos (Semáforos de Estado y Desvío)
| Estado | Token Claro | Token Oscuro | Significado Operativo |
| :--- | :--- | :--- | :--- |
| **En plazo / OK** | `--ok: #2e7d52` | `--ok: #4fbf82` | Orden en tiempo y forma / Etapa completada |
| **En riesgo / Alerta** | `--warn: #b7791f` | `--warn: #e0a63a` | Vence en $\le 3$ días con $<80\%$ avance o desvío de horas $>15\%$ |
| **Atrasado / Crítico** | `--bad: #c0392b` | `--bad: #ee6a5a` | Fecha vencida o horas reales superan horas vendidas |
| **Terminado / Neutro** | `--done: #6b7780` | `--done: #8997a0` | Orden completada al $100\%$ |

---

## 3. Tipografía y Escala

* **Familias Tipográficas (Google Fonts):**
  * **Display / Números / Títulos:** `'Barlow Condensed', Barlow, sans-serif` (Pesos: `600`, `700`)
  * **Cuerpo / UI / Inputs:** `'Barlow', system-ui, sans-serif` (Pesos: `400`, `600`)

| Elemento | Familia | Peso | Tamaño | Line-Height | Uso |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `H1` Header | `Barlow Condensed` | `700` | `40px` (`32px` mobile) | `1.0` | Título principal de vista |
| `H2` Sección | `Barlow Condensed` | `700` | `22px` | `1.1` | Encabezados de bloques (`Resumen`, `Flujo`) |
| Número KPI | `Barlow Condensed` | `700` | `46px` | `1.0` | Cifras grandes en tarjetas resumen |
| Título OP (`card`) | `Barlow Condensed` | `700` | `26px` | `1.1` | Código `OT-XXXX` / `OP-XXXX` |
| Días Restantes | `Barlow Condensed` | `700` | `20px` | `1.1` | Indicador `Faltan X días` / `Pasó hace X días` |
| Cuerpo Base | `Barlow` | `400` | `16px` | `1.45` | Textos generales, descripciones, etapas |
| Cliente / Botones | `Barlow` | `600` | `15px–16px` | `1.3` | Nombre de cliente, acciones, labels |
| Badges / Microcopy | `Barlow` | `600` | `12px–14px` | `1.2` | Tag `ahora`, badge de estado, ID de Plano |

---

## 4. Espaciado, Grillas y Layout

* **Contenedor Principal (`.wrap`):** `max-width: 1200px` (o `1100px`), centrado con padding lateral `16px`.
* **Franja Superior Industrial (`.hz`):** Altura `10px`, patrón diagonal amarillo y negro:
  ```css
  background: repeating-linear-gradient(-45deg, var(--yel) 0 14px, #1b1b1b 14px 28px);
  ```
* **Grilla de KPIs (`.kpis`):** `grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))`, `gap: 12px`.
* **Grilla de Tarjetas de Trabajo (`.grid`):** `grid-template-columns: repeat(auto-fill, minmax(340px, 1fr))`, `gap: 14px`.

---

## 5. Anatomía de Componentes Clave

### 5.1. Navegación Superior (`Header` + Tabs)
* Fondo `--head` (`#13202b`), texto blanco.
* Incluye título de sección, estado de sincronización/guardado (`#st` con borde `#4a5a66`) y pestañas de navegación para alternar entre:
  * **Tablero de Taller** (`/`)
  * **Dashboard General** (`/dashboard`)
  * **Configuración** (`/configuracion`)
* Selector rápido de tema (`Claro / Oscuro`).

### 5.2. Tarjeta KPI (`.kpi`)
* Fondo `--surface`, borde `1px solid var(--line)`, borde superior grueso de `6px solid var(--c)` (donde `--c` toma el color semántico del indicador).
* Estructura vertical: Cifra gigante (`46px` en `--c`) $\rightarrow$ Título en negrita (`16px`) $\rightarrow$ Subtítulo descriptivo (`13px` en `--mute`).

### 5.3. Tira de Flujo por Sector ("Dónde está cada trabajo ahora")
* Contenedor flex horizontal con scroll (`overflow-x: auto`).
* Cada sector es un bloque tipo flecha (`clip-path: polygon(...)`) con fondo `--head` (`#13202b`), contador en `--yel` (`30px` `Barlow Condensed`) y nombre de la etapa debajo.

### 5.4. Tarjeta Autocontenida de Orden de Producción (`.card`)
* **Contenedor:** Fondo `--surface`, borde `1px solid var(--line)`, borde superior de `8px solid var(--c)` según estado de plazo.
* **Zona 1 — Identificación:**
  * Fila superior: `N° OP` (`26px` bold) a la izquierda + Badge de estado (`--c`, texto blanco, `padding: 2px 10px`) a la derecha.
  * Sub-etiqueta de **ID de Plano**: Pill sutil `Plano: PL-XXXX` (borde `--line`, fondo `--bg`) o `Sin plano` en `--mute`.
  * Nombre del `Cliente` (`font-weight: 600`) y `Descripción de pieza` (`--mute`, `15px`).
* **Zona 2 — Progreso Físico y Plazo (`.mid`):**
  * Izquierda: **Anillo de progreso circular** (`88px x 88px`) construido con `conic-gradient(var(--c) calc(var(--p)*1%), var(--track) 0)` mostrando el `%` en el centro.
  * Derecha: Control de `% Avance`, `Fecha de Entrega` y texto destacado de días restantes/atraso en `--c`.
* **Zona 3 — Termómetro de Horas (Vendidas vs. Reales):**
  * Barra horizontal compacta debajo de `.mid`: muestra `Horas: 32h / 40h (80%)`.
  * Color `--ok` si el consumo es acorde al avance; `--warn` si supera el avance físico en $>15\%$; `--bad` si supera el $100\%$ de las horas vendidas.
* **Zona 4 — Lista Interna de Etapas (`.stages`):**
  * Separada por `border-top: 1px dashed var(--line)`.
  * Cada fila (`.st`) tiene borde izquierdo de `4px`:
    * *Completada (`.ok`):* Borde `--ok`, checkbox tildado, texto tachado en `--mute`.
    * *Etapa Activa (`.now`):* Borde `--yel`, fondo `--bg` resaltado, badge amarillo **`ahora`** (`background: var(--yel); color: #1b1b1b; font-size: 12px; font-weight: 600`).
    * *Pendiente:* Borde `--line`.
* **Zona 5 — Acciones Rápidas de Tarjeta:**
  * Botones compactos al pie: `+ Cargar Horas`, `Ver Detalle / Costeo`, `Exportar OP (.xlsx)`.

### 5.5. Botones e Inputs
* **Botón Primario:** `background: var(--accent)`, texto `#fff`, `padding: 9px 16px`, `font-weight: 600`, sin bordes redondeados (`border-radius: 0`).
* **Botón Secundario (`.ghost`):** `background: transparent`, `border: 1px solid var(--line)`, texto `--ink`.
* **Inputs:** Fondo `--surface`, `border: 1px solid var(--line)`, `padding: 6px 10px`. En modo edición inline dentro de tarjetas, borde transparente que aparece en `:hover` y `:focus`.
* **Accesibilidad:** Todos los elementos interactivos mantienen `outline: 3px solid var(--accent); outline-offset: 2px` en `:focus-visible`.

### 5.6. Componentes del Dashboard General (`/dashboard`)
* **Gráficos de Barras Comparativas:** Barras agrupadas horizontales o verticales comparando `Horas Vendidas` (`--accent`) vs. `Horas Reales` (`--yel` o `--bad` si excede) por etapa/sector.
* **Tabla de Control de Desvíos:** Tabla de ancho completo con cabecera `--head` (texto blanco), filas alternadas con bordes `--line`, alineación a la derecha para cifras numéricas (`tabular-nums`) y celdas de desvío negativo resaltadas en `--bad`.

---

## 6. Reglas de Impresión (`@media print`)
* Ocultar barra de herramientas (`.tools`), botones de edición (`.edit`), filtros y pestañas de navegación.
* Forzar fondo blanco (`#fff`) y texto oscuro (`#16212a`) para permitir imprimir órdenes de taller limpias directamente desde el navegador.

---

## 7. Mapeo a implementación

* Los tokens de color, tipografía y espaciado viven en `frontend/src/global.css` dentro de `:root` (y en el bloque oscuro correspondiente). Se consumen con `var(--token)` desde archivos `*.module.css`; los valores hexadecimales no se repiten en componentes.
* Las primitivas compartidas (botones, badges, tarjetas KPI, tablas y estados vacíos) se ubican en `frontend/src/shared/ui/`. Las clases condicionales se componen con `clsx`, manteniendo la estética industrial: bordes definidos, franja amarilla/negra y tipografía condensada para cifras.
* Los nombres de clase del prototipo (`.wrap`, `.card`, `.kpis`, `.st`, entre otros) son referencia visual, **no** clases-utilitarias: no se pueden usar directamente con CSS Modules porque se transforman con hash de alcance local. Cada componente define sus propias clases en su `*.module.css`.
* El selector de tema corresponde a Fase 2 (HU-08) y la vista `/configuracion` se implementa en C-10; ninguno forma parte del alcance de C-18 (UI del dashboard y tokens base del MVP).