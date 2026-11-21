## ADDED Requirements

### Requirement: Tira "Dónde está cada trabajo ahora" desde el flujo derivado

El tablero DEBE (SHALL) renderizar el arreglo `flujo` de `GET /api/ops` como una tira superior de conteo por etapa, conservando las cantidades y el orden recibidos. NO DEBE (SHALL NOT) reagrupar, ordenar ni volver a calcular el flujo en el frontend (HU-06, RN-FLujo-01, RN-GLOBAL-02).

#### Scenario: Conteo por etapa activa

- **WHEN** `flujo` contiene `{ etapa: "Soldadura", cantidad: 2 }` y `{ etapa: "Pintura", cantidad: 1 }`
- **THEN** la tira muestra esos dos grupos con esas cantidades y en ese orden

#### Scenario: Flujo vacío

- **WHEN** `flujo` es un arreglo vacío
- **THEN** la tira indica que no hay trabajos en curso y no renderiza ningún grupo

#### Scenario: OP terminada ya excluida por el dominio

- **WHEN** una OP del tablero tiene `semaforo` `"Terminado"` y `avance` `100`
- **THEN** esa OP no aporta ningún grupo a la tira porque el backend ya la excluyó, y la UI no aplica filtros propios sobre `flujo`

### Requirement: Badge "ahora" por igualdad con el campo derivado

La tarjeta DEBE (SHALL) mostrar el badge `ahora` únicamente en la etapa cuyo `nombre` coincide con `etapaAhora` del DTO y que no está completada. Cuando `etapaAhora` vale `"Todo listo"`, NO DEBE (SHALL NOT) mostrarse ningún badge (HU-07, RN-AHORA-01, RN-GLOBAL-02).

#### Scenario: Primera etapa pendiente

- **WHEN** una tarjeta trae las etapas `Corte` completada y `Soldadura` pendiente, y `etapaAhora` es `"Soldadura"`
- **THEN** el badge `ahora` aparece sólo en `Soldadura` y no en `Corte`

#### Scenario: Tarjeta terminada

- **WHEN** `etapaAhora` es `"Todo listo"` y todas las etapas están completadas
- **THEN** ninguna etapa muestra el badge `ahora` y la tarjeta refleja el estado terminado proveniente del DTO

#### Scenario: Badge sin recálculo

- **WHEN** se renderiza el badge de una tarjeta
- **THEN** la UI compara `etapa.nombre` con el campo `etapaAhora` recibido y no invoca la función `etapaAhora(...)`, no ordena etapas ni busca por su cuenta la primera pendiente

> **Nota (OQ-1 resuelta, 2026-11-21):** la identidad del badge es por nombre derivado del DTO. Se adopta la regla de negocio "los nombres de etapa son únicos dentro de una OP"; su validación se implementará en C-06 `ordenes-y-linea-base-api`, caso de uso `gestionarEtapas`. C-05 no implementa esa validación ni agrega un test de nombres duplicados, porque el contrato adoptado los prohíbe upstream.
