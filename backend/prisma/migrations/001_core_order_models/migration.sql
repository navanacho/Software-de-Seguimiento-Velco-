-- CreateTable
CREATE TABLE "configuracion" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "valor_hora_estandar" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "dias_alerta_riesgo" INTEGER NOT NULL DEFAULT 3,
    "porcentaje_avance_riesgo" INTEGER NOT NULL DEFAULT 80,
    "etapas_default" JSONB NOT NULL DEFAULT '["Corte","Soldadura","Mecanizado","Pintura","Entrega"]',

    CONSTRAINT "configuracion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" VARCHAR(150) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordenes_trabajo" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "numero_op" VARCHAR(50) NOT NULL,
    "cliente_id" UUID NOT NULL,
    "descripcion_pieza" TEXT NOT NULL,
    "fecha_ingreso" DATE NOT NULL DEFAULT CURRENT_DATE,
    "fecha_entrega" DATE NOT NULL,
    "monto_vendido" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "observaciones" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ordenes_trabajo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "etapas_orden" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "orden_id" UUID NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "orden_secuencia" INTEGER NOT NULL,
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "horas_vendidas" DECIMAL(8,2) NOT NULL DEFAULT 0,

    CONSTRAINT "etapas_orden_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clientes_nombre_key" ON "clientes"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "ordenes_trabajo_numero_op_key" ON "ordenes_trabajo"("numero_op");

-- CreateIndex
CREATE INDEX "ordenes_trabajo_cliente_id_idx" ON "ordenes_trabajo"("cliente_id");

-- CreateIndex
CREATE INDEX "ordenes_trabajo_fecha_entrega_idx" ON "ordenes_trabajo"("fecha_entrega");

-- CreateIndex
CREATE UNIQUE INDEX "etapas_orden_orden_id_orden_secuencia_key" ON "etapas_orden"("orden_id", "orden_secuencia");

-- AddForeignKey
ALTER TABLE "ordenes_trabajo" ADD CONSTRAINT "ordenes_trabajo_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etapas_orden" ADD CONSTRAINT "etapas_orden_orden_id_fkey" FOREIGN KEY ("orden_id") REFERENCES "ordenes_trabajo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CheckConstraints
ALTER TABLE "configuracion" ADD CONSTRAINT "configuracion_id_check" CHECK ("id" = 1);
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_nombre_not_empty_check" CHECK (length(btrim("nombre")) > 0);
ALTER TABLE "etapas_orden" ADD CONSTRAINT "etapas_orden_horas_vendidas_check" CHECK ("horas_vendidas" >= 0);
