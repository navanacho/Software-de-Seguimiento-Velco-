-- 002_ordenes_y_linea_base: plano opcional único parcial + materiales aditivos
ALTER TABLE "ordenes_trabajo"
  ADD COLUMN "codigo_plano" VARCHAR(80);

ALTER TABLE "ordenes_trabajo"
  ADD CONSTRAINT "ordenes_trabajo_codigo_plano_not_empty_check"
  CHECK ("codigo_plano" <> '');

CREATE UNIQUE INDEX "ordenes_trabajo_codigo_plano_key"
  ON "ordenes_trabajo" ("codigo_plano")
  WHERE "codigo_plano" IS NOT NULL;

CREATE TYPE "TipoMaterial" AS ENUM ('MP', 'INSUMOS', 'TERCERIZADOS');

CREATE TABLE "materiales_orden" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "orden_id" UUID NOT NULL,
  "tipo" "TipoMaterial" NOT NULL,
  "descripcion" TEXT NOT NULL,
  "cantidad" DECIMAL(12,4) NOT NULL,
  "unidad" VARCHAR(20),
  "costo_unitario_cotizado" DECIMAL(14,2) NOT NULL,
  "costo_unitario_real" DECIMAL(14,2),
  "nro_remito" VARCHAR(50),
  "nro_factura" VARCHAR(50),
  "nt" VARCHAR(50),
  "po" VARCHAR(50),
  CONSTRAINT "materiales_orden_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "materiales_orden_orden_id_fkey" FOREIGN KEY ("orden_id") REFERENCES "ordenes_trabajo"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "materiales_orden_cantidad_check" CHECK ("cantidad" > 0),
  CONSTRAINT "materiales_orden_costo_cotizado_check" CHECK ("costo_unitario_cotizado" >= 0),
  CONSTRAINT "materiales_orden_costo_real_check" CHECK ("costo_unitario_real" IS NULL OR "costo_unitario_real" >= 0),
  CONSTRAINT "materiales_orden_descripcion_not_empty_check" CHECK (length(btrim("descripcion")) > 0)
);

CREATE INDEX "materiales_orden_orden_id_tipo_idx" ON "materiales_orden" ("orden_id", "tipo");
CREATE INDEX "materiales_orden_nro_factura_idx" ON "materiales_orden" ("nro_factura");
CREATE INDEX "materiales_orden_nt_idx" ON "materiales_orden" ("nt");
CREATE INDEX "materiales_orden_po_idx" ON "materiales_orden" ("po");
