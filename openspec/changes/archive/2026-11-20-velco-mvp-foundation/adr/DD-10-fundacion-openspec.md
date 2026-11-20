# DD-10 — Fundación del proyecto con OpenSpec antes que código

Versión: 1
Estado: Aceptada

## Contexto

El proyecto necesitaba trazabilidad entre requisitos, roadmap, reglas para agentes y cambios implementables antes de escribir código de aplicación.

## Decisión

`openspec init` ejecutado. El orden de fundación es KB → `CHANGES.md` → `AGENTS.md` → change `velco-mvp-foundation`. La documentación de `openspec/` se gestiona solo por CLI (R8).

## Alternativas

- Arrancar el Sprint 1 sin documentación ni specs.
- Crear `AGENTS.md` antes que la KB.

## Justificación

El flujo SDD/OpenSpec exige decisiones y dominio documentados para que cada change sea verificable.

## Trade-offs

Trabajo inicial de documentación antes de la primera pantalla. Los ADR se versionan en `openspec/changes/velco-mvp-foundation/adr/` como parte del change para no editar `openspec/` a mano fuera del flujo de la CLI.

## Trazabilidad

[CHANGES.md](../../../../CHANGES.md) C-01; [design.md](../design.md) D10; [knowledge-base/09_decisiones_y_supuestos.md](../../../../knowledge-base/09_decisiones_y_supuestos.md) DD-10.
