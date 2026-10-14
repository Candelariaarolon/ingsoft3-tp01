export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// El commit que corre ESTE front. Va fuera de /api a propósito: todo /api/* lo
// reenvía el proxy al backend, y ahí contestaría el commit de la api. El smoke
// del pipeline lo compara con el commit que acaba de desplegar: sin esto, un
// hook del front mal cargado dejaba el front viejo y el job en verde igual.
export function GET() {
  return Response.json({
    status: "ok",
    commit: process.env.RENDER_GIT_COMMIT ?? "desconocido",
  });
}
