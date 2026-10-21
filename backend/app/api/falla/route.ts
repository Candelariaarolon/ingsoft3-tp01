// TEMPORAL (TP9 §3.5): un endpoint que falla a propósito, para ver un error llegar a Sentry.
// Se saca cuando termine el práctico.
export const dynamic = "force-dynamic"; // si no, Next lo ejecuta al compilar y el build falla

export function GET(): Response {
  throw new Error("Falla de prueba del TP9");
}
