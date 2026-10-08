import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // El mismo alias "@/..." que usa tsconfig.json, para que los tests puedan
  // importar igual que el código de la app.
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      // json-summary deja coverage-summary.json, que es lo que el pipeline lee
      // para armar la tabla del Summary de la corrida.
      reporter: ["text", "html", "lcov", "json-summary"],
      // Una carpeta, no una lista de archivos: todo archivo nuevo en lib/ entra
      // solo a la cuenta, aunque nadie lo testee. Las rutas de app/api quedan
      // afuera porque ya no tienen reglas: solo piden, delegan en lib/ y
      // responden.
      include: ["lib/**"],
      // prisma.ts solo crea la conexión a la base (arranque): no tiene reglas.
      exclude: ["lib/prisma.ts"],
      // El umbral que frena el build: un poco por debajo de lo medido (87,09 %
      // de líneas y 88,76 % de ramas), para que pase hoy y frene si entra
      // código sin tests. Va en las dos métricas, como pide la guía (§3.5).
      thresholds: { lines: 85, branches: 85 },
    },
  },
});
