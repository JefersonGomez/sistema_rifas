-- CreateEnum
CREATE TYPE "EstadoRifa" AS ENUM ('borrador', 'activa', 'finalizada', 'cancelada');

-- CreateEnum
CREATE TYPE "EstadoBoleto" AS ENUM ('apartado', 'pagado');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('efectivo', 'sinpe');

-- CreateTable
CREATE TABLE "admins" (
    "id" SERIAL NOT NULL,
    "usuario" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rifas" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "premio" TEXT NOT NULL,
    "foto_url" TEXT,
    "precio_numero" INTEGER NOT NULL,
    "costo_premio" INTEGER NOT NULL DEFAULT 0,
    "fecha_sorteo" TIMESTAMP(3),
    "regla_ganador" TEXT,
    "numero_ganador" CHAR(2),
    "estado" "EstadoRifa" NOT NULL DEFAULT 'borrador',
    "sinpe_numero" TEXT,
    "whatsapp" TEXT,
    "creada_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizada_en" TIMESTAMP(3),

    CONSTRAINT "rifas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" CHAR(8) NOT NULL,
    "notas" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boletos" (
    "id" SERIAL NOT NULL,
    "rifa_id" INTEGER NOT NULL,
    "numero" CHAR(2) NOT NULL,
    "cliente_id" INTEGER NOT NULL,
    "estado" "EstadoBoleto" NOT NULL DEFAULT 'apartado',
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "boletos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos" (
    "id" SERIAL NOT NULL,
    "boleto_id" INTEGER NOT NULL,
    "monto" INTEGER NOT NULL,
    "metodo" "MetodoPago" NOT NULL,
    "referencia" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nota" TEXT,

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recordatorios" (
    "id" SERIAL NOT NULL,
    "cliente_id" INTEGER NOT NULL,
    "rifa_id" INTEGER NOT NULL,
    "enviado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recordatorios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_usuario_key" ON "admins"("usuario");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_telefono_key" ON "clientes"("telefono");

-- CreateIndex
CREATE INDEX "boletos_cliente_id_idx" ON "boletos"("cliente_id");

-- CreateIndex
CREATE UNIQUE INDEX "boletos_rifa_id_numero_key" ON "boletos"("rifa_id", "numero");

-- CreateIndex
CREATE INDEX "pagos_boleto_id_idx" ON "pagos"("boleto_id");

-- CreateIndex
CREATE INDEX "recordatorios_cliente_id_rifa_id_idx" ON "recordatorios"("cliente_id", "rifa_id");

-- AddForeignKey
ALTER TABLE "boletos" ADD CONSTRAINT "boletos_rifa_id_fkey" FOREIGN KEY ("rifa_id") REFERENCES "rifas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boletos" ADD CONSTRAINT "boletos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_boleto_id_fkey" FOREIGN KEY ("boleto_id") REFERENCES "boletos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recordatorios" ADD CONSTRAINT "recordatorios_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recordatorios" ADD CONSTRAINT "recordatorios_rifa_id_fkey" FOREIGN KEY ("rifa_id") REFERENCES "rifas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Reglas de negocio que Prisma no expresa en el esquema
-- Solo puede haber una rifa activa a la vez
CREATE UNIQUE INDEX "rifas_una_activa" ON "rifas"("estado") WHERE "estado" = 'activa';

-- Números de rifa siempre de dos dígitos (00 a 99)
ALTER TABLE "boletos" ADD CONSTRAINT "boletos_numero_check" CHECK ("numero" ~ '^[0-9]{2}$');
ALTER TABLE "rifas" ADD CONSTRAINT "rifas_numero_ganador_check" CHECK ("numero_ganador" ~ '^[0-9]{2}$');

-- Teléfonos de Costa Rica: 8 dígitos
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_telefono_check" CHECK ("telefono" ~ '^[0-9]{8}$');

-- Montos en colones, enteros positivos
ALTER TABLE "rifas" ADD CONSTRAINT "rifas_precio_numero_check" CHECK ("precio_numero" > 0);
ALTER TABLE "rifas" ADD CONSTRAINT "rifas_costo_premio_check" CHECK ("costo_premio" >= 0);
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_monto_check" CHECK ("monto" > 0);
