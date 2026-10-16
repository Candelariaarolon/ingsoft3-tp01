import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// "¿El proceso está vivo?" — no toca la base, así que contesta aunque la
// conexión esté rota (para eso está /api/health/db).
export async function GET() {
  return NextResponse.json({ status: "ok" });
}
