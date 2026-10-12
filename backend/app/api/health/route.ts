import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// "¿El proceso está vivo?" — no toca la base, así que contesta aunque la
// conexión esté rota (para eso está /api/health/db). Devuelve además el commit
// que corre: Render lo expone en RENDER_GIT_COMMIT, y el smoke lo compara con
// el que acaba de desplegar para no dar verde contra la versión vieja.
export async function GET() {
  return NextResponse.json({
    status: "ok",
    commit: process.env.RENDER_GIT_COMMIT ?? "desconocido",
  });
}
