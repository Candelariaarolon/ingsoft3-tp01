-- AlterTable
-- DEFAULT '' es solo para no romper las filas ya existentes al agregar la
-- columna NOT NULL; se saca enseguida porque el signup siempre manda un
-- valor explícito, no depende del default de la base.
ALTER TABLE "User" ADD COLUMN "telefono" TEXT NOT NULL DEFAULT '';
ALTER TABLE "User" ALTER COLUMN "telefono" DROP DEFAULT;
