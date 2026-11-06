-- Premios por lugar (1.º, 2.º y 3.er) en su propia tabla.

-- CreateTable
CREATE TABLE "premios" (
    "id" SERIAL NOT NULL,
    "rifa_id" INTEGER NOT NULL,
    "lugar" INTEGER NOT NULL,
    "descripcion" TEXT NOT NULL,
    "costo" INTEGER NOT NULL DEFAULT 0,
    "numero_ganador" CHAR(2),

    CONSTRAINT "premios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "premios_rifa_id_lugar_key" ON "premios"("rifa_id", "lugar");

-- AddForeignKey
ALTER TABLE "premios" ADD CONSTRAINT "premios_rifa_id_fkey" FOREIGN KEY ("rifa_id") REFERENCES "rifas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- El premio que ya tenía cada rifa pasa a ser su 1.er premio (sin perder datos).
INSERT INTO "premios" ("rifa_id", "lugar", "descripcion", "costo", "numero_ganador")
SELECT "id", 1, "premio", "costo_premio", "numero_ganador" FROM "rifas";

-- Reglas: lugar 1 a 3, costo no negativo, número ganador de dos cifras.
ALTER TABLE "premios" ADD CONSTRAINT "premios_lugar_check" CHECK ("lugar" BETWEEN 1 AND 3);
ALTER TABLE "premios" ADD CONSTRAINT "premios_costo_check" CHECK ("costo" >= 0);
ALTER TABLE "premios" ADD CONSTRAINT "premios_numero_ganador_check" CHECK ("numero_ganador" ~ '^[0-9]{2}$');

-- AlterTable
ALTER TABLE "rifas" DROP COLUMN "costo_premio",
DROP COLUMN "numero_ganador",
DROP COLUMN "premio";
