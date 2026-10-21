import { withSentryConfig } from "@sentry/nextjs/config";

/** @type {import('next').NextConfig} */
const nextConfig = {};

// withSentryConfig instrumenta los route handlers (errores y tiempos de cada pedido).
export default withSentryConfig(nextConfig, { silent: true });
