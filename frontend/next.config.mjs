/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // El navegador solo le habla a este origen — nunca se entera de que
  // /api/* en realidad vive en otro proceso/contenedor. Eso es lo que deja
  // que la cookie de sesión (httpOnly) siga funcionando sin CORS ni
  // SameSite=None: para el browser todo pasó siempre por el mismo dominio.
  //
  // OJO: el destino se resuelve acá, una sola vez, durante `next build` —
  // no se vuelve a leer BACKEND_URL en runtime. En Docker hay que pasarlo
  // como build arg (ver frontend/Dockerfile), no alcanza con seteario en
  // `environment:` del docker-compose.
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4000";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
