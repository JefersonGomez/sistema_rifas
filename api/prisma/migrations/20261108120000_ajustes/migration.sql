-- Mensajes de WhatsApp personalizados (una sola fila).
CREATE TABLE "ajustes" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "mensaje_apartar" TEXT,
    "mensaje_recordatorio" TEXT,
    "mensaje_libres" TEXT,

    CONSTRAINT "ajustes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ajustes_una_fila" CHECK ("id" = 1)
);
