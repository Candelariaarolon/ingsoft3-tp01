import * as Sentry from "@sentry/nextjs";

// Next.js llama a register() una vez, al arrancar el servidor.
// El DSN llega por el entorno: sólo está cargado en curatta-api-prod. Sin la
// variable (mi máquina, los tests, QA) Sentry queda apagado y la api anda igual.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 1.0, // medir todos los pedidos
      // El SDK 11 manda los tiempos como "spans" sueltos; el tablero Backend Overview
      // arma su tabla Transactions con transacciones: "static" vuelve a ese formato.
      traceLifecycle: "static",
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
