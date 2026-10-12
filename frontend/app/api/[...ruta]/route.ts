import type { NextRequest } from "next/server";
import { destinoEnElBackend, encabezadosDeLaRespuesta, encabezadosDelPedido } from "@/lib/proxy";

export const runtime = "nodejs";
// Sin esto Next podría resolverlo en el build; tiene que leer BACKEND_URL y
// reenviar en cada pedido.
export const dynamic = "force-dynamic";

async function reenviar(req: NextRequest): Promise<Response> {
  const destino = destinoEnElBackend(process.env.BACKEND_URL, req.nextUrl.pathname, req.nextUrl.search);
  const sinCuerpo = req.method === "GET" || req.method === "HEAD";

  const res = await fetch(destino, {
    method: req.method,
    headers: encabezadosDelPedido(req.headers),
    body: sinCuerpo ? undefined : await req.arrayBuffer(),
    redirect: "manual",
    cache: "no-store",
  });

  return new Response(res.body, { status: res.status, headers: encabezadosDeLaRespuesta(res.headers) });
}

export { reenviar as GET, reenviar as POST, reenviar as PUT, reenviar as PATCH, reenviar as DELETE };
