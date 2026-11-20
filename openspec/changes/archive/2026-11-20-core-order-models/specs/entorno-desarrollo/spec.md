## MODIFIED Requirements

### Requirement: Esquema Prisma inicializado sin modelos de negocio

`backend/prisma/schema.prisma` DEBE (SHALL) contener `datasource` apuntando a PostgreSQL y `generator` de Prisma 7.10.1 (cliente y CLI), y a partir del change `core-order-models` DEBE (SHALL) definir los modelos `Configuracion`, `Cliente`, `OrdenTrabajo` y `EtapaOrden` correspondientes a la migración 001. NO DEBE (SHALL NOT) definir columnas derivadas como avance, totales de horas, costos, margen o semáforo, ni modelo de `usuarios`. No se usa Prisma 8.0.0-rc.34 por ser release candidate.

#### Scenario: Inspección del esquema

- **WHEN** se abre `backend/prisma/schema.prisma`
- **THEN** están presentes `datasource`, `generator` y los cuatro modelos de C-02, sin derivados persistidos ni modelo `usuarios`

#### Scenario: Generador fijado

- **WHEN** se inspecciona el bloque `generator` del esquema
- **THEN** declara Prisma 7.10.1 como versión exacta del cliente y de la CLI
