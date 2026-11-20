# DD-09 — Skills instaladas como apoyo

Versión: 1
Estado: Aceptada

## Contexto

La fundación define qué herramientas de conocimiento se usan para modelar el dominio, configurar Prisma y PostgreSQL, seguir buenas prácticas React y escribir tests.

## Decisión

Usar `prisma-orm-setup`, `postgresql-database-engineering`, `domain-modeling`, `vercel-react-best-practices`, `docker-compose-orchestration` y `vitest` como apoyo, con criterio: el deployment no es Vercel.

## Alternativas

- No usar skills y confiar solo en documentación general.
- Instalar skills adicionales sin necesidad.

## Justificación

Alinean la implementación con el stack elegido y con TDD estricto y arquitectura hexagonal.

## Trade-offs

Dependencia de que las skills estén actualizadas; `vercel-react-best-practices` se aplica con criterio.

## Trazabilidad

[CHANGES.md](../../../../CHANGES.md) C-01; [design.md](../design.md) D1; [knowledge-base/09_decisiones_y_supuestos.md](../../../../knowledge-base/09_decisiones_y_supuestos.md) DD-09.
