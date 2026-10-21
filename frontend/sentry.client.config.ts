import * as Sentry from "@sentry/nextjs";

// El DSN de un front NO es un secreto: sólo sirve para ENVIAR datos, no para leerlos,
// y viaja igual en el JavaScript que baja el navegador.
Sentry.init({
  dsn: "https://fa97e44b2b69f54217bbaab158f5a8bd@o4512296337539072.ingest.us.sentry.io/4512296370503680",
  environment: window.location.hostname, // de qué sitio vino: QA, producción o localhost
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 1.0,
  traceLifecycle: "static", // transacciones, como las arma Frontend Overview (igual que en el back)
});
