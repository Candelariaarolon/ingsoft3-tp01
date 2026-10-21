import { withSentryConfig } from "@sentry/nextjs/config";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // Ya no hay rewrites(): su destino se resolvía en `next build` y quedaba
  // horneado en la imagen. El reenvío de /api/* al backend lo hace
  // app/api/[...ruta]/route.ts, que lee BACKEND_URL en cada pedido. El
  // navegador sigue hablándole sólo a este origen, así la cookie de sesión
  // (httpOnly) funciona sin CORS ni SameSite=None.
};

// withSentryConfig mete sentry.client.config.ts en el JavaScript que baja el navegador.
export default withSentryConfig(nextConfig, { silent: true });
