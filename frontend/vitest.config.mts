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
  },
});
