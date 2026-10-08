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
      // solo a la cuenta, aunque nadie lo testee. Los componentes y las páginas
      // quedan afuera: son pegamento de UI, su lógica ya está en lib/.
      include: ["lib/**"],
    },
  },
});
