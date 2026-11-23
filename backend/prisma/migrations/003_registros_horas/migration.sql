-- 003_registros_horas: partes de horas reales por OP (DD-07, R3, R5)
CREATE TABLE "registros_horas" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "orden_id" UUID NOT NULL,
  "etapa_id" UUID,
  "operario" VARCHAR(100) NOT NULL,
  "fecha" DATE NOT NULL DEFAULT CURRENT_DATE,
  "horas" DECIMAL(6,2) NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "observacion" TEXT,
  CONSTRAINT "registros_horas_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "registros_horas_orden_id_fkey" FOREIGN KEY ("orden_id") REFERENCES "ordenes_trabajo"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "registros_horas_etapa_id_fkey" FOREIGN KEY ("etapa_id") REFERENCES "etapas_orden"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "registros_horas_horas_check" CHECK ("horas" > 0)
);

CREATE INDEX "registros_horas_orden_id_fecha_idx" ON "registros_horas" ("orden_id", "fecha");
CREATE INDEX "registros_horas_etapa_id_idx" ON "registros_horas" ("etapa_id");
CREATE INDEX "registros_horas_operario_idx" ON "registros_horas" ("operario");
