import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { analyzeImageModaFromDataUrl } from "@/lib/moda-taxonomia";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Data URL base64 — ~7M caracteres cubre una foto de varios MB sin dejar
// subir blobs arbitrariamente grandes a la base.
const MAX_FOTO_CHARS = 7 * 1024 * 1024;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const publicaciones = await prisma.publicacion.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ publicaciones });
}

type Body = { nombre?: unknown; precio?: unknown; foto?: unknown };

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as Body | null;
  const nombre = typeof body?.nombre === "string" ? body.nombre.trim() : "";
  const precio = typeof body?.precio === "number" ? body.precio : NaN;
  const foto = typeof body?.foto === "string" ? body.foto : "";

  if (!nombre) {
    return NextResponse.json({ error: "Falta el nombre de la prenda" }, { status: 400 });
  }
  if (!Number.isFinite(precio) || precio <= 0) {
    return NextResponse.json({ error: "El precio debe ser mayor a 0" }, { status: 400 });
  }
  if (!foto || !foto.startsWith("data:image/")) {
    return NextResponse.json({ error: "Falta la foto de la prenda" }, { status: 400 });
  }
  if (foto.length > MAX_FOTO_CHARS) {
    return NextResponse.json({ error: "La foto es demasiado pesada" }, { status: 400 });
  }

  // Best-effort: si el análisis falla (Azure caído, sin credenciales, etc.)
  // la publicación se crea igual — solo queda afuera del matching por foto
  // hasta que se pueda re-analizar.
  let analisis: Awaited<ReturnType<typeof analyzeImageModaFromDataUrl>> | null = null;
  try {
    analisis = await analyzeImageModaFromDataUrl(foto);
  } catch (err) {
    console.error("[publicaciones] no se pudo analizar la foto:", err);
  }

  const publicacion = await prisma.publicacion.create({
    data: {
      userId: session.user.id,
      nombre,
      precio,
      foto,
      tipoPrenda: analisis?.tipo_prenda,
      siluetaCorte: analisis?.silueta_corte,
      patron: analisis?.patron,
      familiaColor: analisis?.familia_color,
      texturaTela: analisis?.textura_tela,
      formalidadEstilo: analisis?.formalidad_estilo,
    },
  });

  return NextResponse.json({ publicacion });
}
