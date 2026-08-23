import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { matchContraPublicaciones } from "@/lib/matching-publicaciones";

export const runtime = "nodejs";

type Body = { foto?: unknown };

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as Body | null;
  const foto = typeof body?.foto === "string" ? body.foto : "";
  if (!foto || !foto.startsWith("data:image/")) {
    return NextResponse.json({ error: "Falta la foto a buscar" }, { status: 400 });
  }

  try {
    const resultado = await matchContraPublicaciones(foto, { excludeUserId: session.user.id });
    return NextResponse.json(resultado);
  } catch (err) {
    console.error("[publicaciones/buscar] Error:", err);
    return NextResponse.json(
      { error: "No pudimos analizar la imagen", matches: [] },
      { status: 502 }
    );
  }
}
