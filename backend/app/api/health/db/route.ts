import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// "¿La base responde?" — un /api/health que no toca la base da verde con la
// DATABASE_URL rota. Este hace una consulta mínima y devuelve 503 si falla,
// así el smoke del pipeline se pone rojo.
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", db: "ok" });
  } catch {
    return NextResponse.json({ status: "error", db: "sin conexión" }, { status: 503 });
  }
}
